'use client';

import { useMemo, useCallback, useState, useEffect } from 'react';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { useAuth } from './auth-context';
import {
  MaintenanceRequest,
  WorkOrder,
  WorkOrderPart,
  NotificationItem,
  AuditLogEntry,
  UserProfile,
  UserRole,
  RequestStatus,
  WorkOrderStatus,
  PriorityLevel,
  DuplicateCandidate,
  CampusLocation,
} from './types';
import {
  GET_REQUESTS_QUERY,
  GET_WORK_ORDERS_QUERY,
  GET_NOTIFICATIONS_QUERY,
  GET_USERS_QUERY,
  GET_AUDIT_LOGS_QUERY,
  GET_ANALYTICS_SUMMARY_QUERY,
  GET_LOCATIONS_QUERY,
  CREATE_REQUEST_MUTATION,
  UPVOTE_REQUEST_MUTATION,
  REMOVE_UPVOTE_MUTATION,
  MARK_DUPLICATE_MUTATION,
  UNMARK_DUPLICATE_MUTATION,
  OVERRIDE_PRIORITY_MUTATION,
  CREATE_WORK_ORDER_MUTATION,
  UPDATE_WORK_ORDER_STATUS_MUTATION,
  COMPLETE_WORK_ORDER_MUTATION,
  VERIFY_WORK_ORDER_MUTATION,
  CREATE_COMMENT_MUTATION,
  MARK_NOTIFICATION_AS_READ_MUTATION,
  MARK_ALL_NOTIFICATIONS_AS_READ_MUTATION,
  UPDATE_USER_ROLE_MUTATION,
  UPDATE_USER_ACTIVE_MUTATION,
  SUGGEST_DUPLICATES_QUERY,
} from './graphql-operations';

const ATTACHMENTS_STORAGE_KEY = 'fixflow_request_attachments';

function getStoredRequestAttachments(): Record<string, string[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(ATTACHMENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistRequestAttachments(map: Record<string, string[]>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ATTACHMENTS_STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

// Map raw GraphQL request to frontend MaintenanceRequest model
function mapRequest(
  r: any,
  currentUserId: string,
  attachmentsMap?: Record<string, string[]>,
): MaintenanceRequest {
  const upvoted = Boolean(r.hasUpvoted);

  // Authoritatively resolve attachments for this specific request
  const customImages = attachmentsMap
    ? attachmentsMap[r.id] || (r.requestNumber ? attachmentsMap[r.requestNumber] : undefined)
    : undefined;

  let requestImages: string[] = [];
  if (customImages && Array.isArray(customImages) && customImages.length > 0) {
    requestImages = customImages;
  } else if (r.requestNumber === 'REQ-DEMO-006' || r.requestNumber === 'REQ-2026-0006') {
    // Only the seeded library water pipe leak demo ticket holds these preset demo images
    requestImages = [
      '/demo-assets/water-leak-evidence.png',
      '/demo-assets/hvac-compressor-fault.png',
    ];
  } else {
    requestImages = [];
  }

  return {
    id: r.id,
    requestNumber: r.requestNumber,
    title: r.title,
    description: r.description,
    category: r.asset?.category?.name || 'Facilities & Infrastructure',
    locationId: r.locationId,
    locationName: r.location?.name
      ? `${r.location.name} (${r.location.building}${r.location.room ? ' - ' + r.location.room : ''})`
      : 'Campus Location',
    building: r.location?.building,
    floor: r.location?.floor,
    room: r.location?.room,
    assetId: r.assetId || undefined,
    assetTag: r.asset?.assetTag,
    assetName: r.asset?.name,
    reportedById: r.requesterId,
    reportedByName: r.requester?.name || 'Campus Reporter',
    reportedByRole: (r.requester?.role as UserRole) || 'REQUESTER',
    reportedAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    status: r.status as RequestStatus,
    priority: r.priority as PriorityLevel,
    priorityFactors: {
      initialSeverity:
        r.priority === 'CRITICAL' ? 10 : r.priority === 'HIGH' ? 8 : r.priority === 'MEDIUM' ? 5 : 2,
      assetCriticality: 5,
      upvoteMultiplier: 1 + (r.upvotesCount || 0) * 0.1,
      unresolvedHoursWeight: 0,
      recurringMultiplier: 1,
      calculatedScore:
        r.priority === 'CRITICAL' ? 95 : r.priority === 'HIGH' ? 75 : r.priority === 'MEDIUM' ? 50 : 25,
      level: r.priority as PriorityLevel,
      isOverridden: Boolean(
        r.verificationNotes?.includes('Overridden') || r.rejectionReason?.includes('Override'),
      ),
    },
    upvotes: r.upvotesCount || 0,
    upvoters: upvoted && currentUserId ? [currentUserId] : [],
    images: requestImages,
    comments: [],
    workOrderId: undefined,
    isDuplicate: Boolean(r.isDuplicate),
    duplicateOfId: r.duplicateOfId || undefined,
    duplicateOfNumber: r.duplicateOfNumber || undefined,
    duplicateReason: r.duplicateReason || undefined,
    updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
  };
}

// Map raw GraphQL work order to frontend WorkOrder model
function mapWorkOrder(wo: any): WorkOrder {
  let partsList: WorkOrderPart[] = [];
  if (wo.partsUsed) {
    try {
      const parsed = JSON.parse(wo.partsUsed);
      if (Array.isArray(parsed)) partsList = parsed;
    } catch {
      partsList = [{ id: 'p-1', name: wo.partsUsed, quantity: 1, unitCost: wo.actualCost || 0 }];
    }
  }

  const req = wo.request;
  const isCompleted = wo.status === 'COMPLETED';
  const isVerified = req?.status === 'VERIFIED' || req?.status === 'CLOSED';
  const isRejected = req?.status === 'REOPENED' || (req?.rejectionReason && !isVerified);

  const verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | undefined = isCompleted
    ? isVerified
      ? 'VERIFIED'
      : isRejected
      ? 'REJECTED'
      : 'PENDING'
    : undefined;

  return {
    id: wo.id,
    orderNumber: wo.orderNumber,
    requestId: wo.requestId,
    requestTitle: req?.title || 'Maintenance Task',
    category: 'Facilities',
    locationName: req?.location?.name
      ? `${req.location.name} (${req.location.building}${req.location.room ? ' - ' + req.location.room : ''})`
      : 'Campus Facility',
    assetName: wo.asset?.name || req?.asset?.name,
    assignedToId: wo.technicianId || '',
    assignedToName: wo.technician?.name || 'Unassigned Technician',
    assignedToEmail: wo.technician?.email || '',
    status: wo.status as WorkOrderStatus,
    priority: (req?.priority as PriorityLevel) || 'MEDIUM',
    slaDeadline: req?.slaDeadline ? new Date(req.slaDeadline).toISOString() : new Date().toISOString(),
    createdAt: wo.createdAt ? new Date(wo.createdAt).toISOString() : new Date().toISOString(),
    startedAt: wo.startedAt ? new Date(wo.startedAt).toISOString() : undefined,
    completedAt: wo.completedAt ? new Date(wo.completedAt).toISOString() : undefined,
    diagnosis: wo.workNotes || '',
    repairNotes: wo.resolutionSummary || '',
    partsUsed: partsList,
    beforeImages: ['https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800'],
    afterImages: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800'],
    verificationStatus,
    rejectionReason: req?.rejectionReason || undefined,
    verifiedAt: req?.closedAt ? new Date(req.closedAt).toISOString() : undefined,
    verifiedBy: req?.verificationNotes || undefined,
  };
}

// Map raw GraphQL notification to frontend NotificationItem
function mapNotification(n: any): NotificationItem {
  let mappedType: NotificationItem['type'] = 'status';
  const rawType = (n.type || '').toLowerCase();
  if (rawType.includes('assign')) mappedType = 'assignment';
  else if (rawType.includes('sla')) mappedType = 'sla';
  else if (rawType.includes('verif')) mappedType = 'verification';
  else if (rawType.includes('dup')) mappedType = 'duplicate';
  else if (rawType.includes('comment')) mappedType = 'comment';

  return {
    id: n.id,
    userId: n.userId,
    title: n.title,
    message: n.message,
    type: mappedType,
    createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
    read: Boolean(n.isRead),
    targetId: n.link || undefined,
    targetType: n.link?.includes('WO') ? 'workOrder' : 'request',
  };
}

// Map raw GraphQL audit log to frontend AuditLogEntry
function mapAuditLog(l: any): AuditLogEntry {
  let parsedDetails = l.action;
  if (l.metadata) {
    try {
      const meta = typeof l.metadata === 'string' ? JSON.parse(l.metadata) : l.metadata;
      parsedDetails = meta.details || meta.reason || meta.message || JSON.stringify(meta);
    } catch {
      parsedDetails = String(l.metadata);
    }
  }

  return {
    id: l.id,
    action: l.action,
    entityType: (l.entity as any) || 'SYSTEM',
    entityId: l.entityId || 'N/A',
    details: parsedDetails,
    performedById: l.actorId || 'system',
    performedByName: l.actorId ? `User (${l.actorId.slice(0, 8)})` : 'System Engine',
    performedByRole: 'ADMIN',
    createdAt: l.timestamp ? new Date(l.timestamp).toISOString() : new Date().toISOString(),
  };
}

// Map raw GraphQL user to frontend UserProfile
function mapUser(u: any): UserProfile {
  return {
    id: u.id,
    name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Campus User',
    email: u.email,
    role: u.role as UserRole,
    department: u.department || 'Campus Facilities',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    active: Boolean(u.isActive),
    phone: u.phone || undefined,
  };
}

const DEFAULT_ANALYTICS = {
  totalRequests: 0,
  unresolvedRequests: 0,
  criticalOrHigh: 0,
  activeWorkOrders: 0,
  pendingVerification: 0,
  slaComplianceRate: 98.4,
  mttrHours: 3.2,
};

export function useDataBridge() {
  const { user: authUser } = useAuth();
  const apolloClient = useApolloClient();

  // Client-side persistent cache for request attachments
  const [requestAttachments, setRequestAttachments] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setRequestAttachments(getStoredRequestAttachments());
  }, []);

  // Active user derived from authenticated session
  const activeUser: UserProfile = useMemo(() => {
    if (authUser) {
      return {
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        role: authUser.role as UserRole,
        department: authUser.department || 'Campus Facilities',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        active: true,
      };
    }
    return {
      id: '',
      name: 'Guest User',
      email: 'guest@fixflow.edu',
      role: 'REQUESTER',
      department: 'Campus Community',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      active: true,
    };
  }, [authUser]);

  // GraphQL Queries
  const {
    data: requestsData,
    loading: requestsLoading,
    error: requestsError,
    refetch: refetchRequests,
  } = useQuery(GET_REQUESTS_QUERY, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 10000,
    skip: !authUser,
  });

  const {
    data: workOrdersData,
    loading: workOrdersLoading,
    refetch: refetchWorkOrders,
  } = useQuery(GET_WORK_ORDERS_QUERY, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 10000,
    skip: !authUser || authUser.role === 'REQUESTER',
  });

  const {
    data: notifData,
    refetch: refetchNotifs,
  } = useQuery(GET_NOTIFICATIONS_QUERY, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 10000,
    skip: !authUser,
  });

  const {
    data: usersData,
    refetch: refetchUsers,
  } = useQuery(GET_USERS_QUERY, {
    fetchPolicy: 'cache-and-network',
    skip: !authUser || (authUser.role !== 'ADMIN' && authUser.role !== 'FACILITY_MANAGER'),
  });

  const {
    data: auditData,
    refetch: refetchAudit,
  } = useQuery(GET_AUDIT_LOGS_QUERY, {
    fetchPolicy: 'cache-and-network',
    skip: !authUser || authUser.role !== 'ADMIN',
  });

  const {
    data: analyticsData,
    refetch: refetchAnalytics,
  } = useQuery(GET_ANALYTICS_SUMMARY_QUERY, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 15000,
    skip: !authUser,
  });

  const {
    data: locationsData,
  } = useQuery(GET_LOCATIONS_QUERY, {
    fetchPolicy: 'cache-first',
    skip: !authUser,
  });

  // GraphQL Mutations
  const [createRequestMutation] = useMutation(CREATE_REQUEST_MUTATION);
  const [upvoteRequestMutation] = useMutation(UPVOTE_REQUEST_MUTATION);
  const [removeUpvoteMutation] = useMutation(REMOVE_UPVOTE_MUTATION);
  const [markDuplicateMutation] = useMutation(MARK_DUPLICATE_MUTATION);
  const [unmarkDuplicateMutation] = useMutation(UNMARK_DUPLICATE_MUTATION);
  const [overridePriorityMutation] = useMutation(OVERRIDE_PRIORITY_MUTATION);
  const [createWorkOrderMutation] = useMutation(CREATE_WORK_ORDER_MUTATION);
  const [updateWorkOrderStatusMutation] = useMutation(UPDATE_WORK_ORDER_STATUS_MUTATION);
  const [completeWorkOrderMutation] = useMutation(COMPLETE_WORK_ORDER_MUTATION);
  const [verifyWorkOrderMutation] = useMutation(VERIFY_WORK_ORDER_MUTATION);
  const [createCommentMutation] = useMutation(CREATE_COMMENT_MUTATION);
  const [markNotificationReadMutation] = useMutation(MARK_NOTIFICATION_AS_READ_MUTATION);
  const [markAllNotificationsReadMutation] = useMutation(MARK_ALL_NOTIFICATIONS_AS_READ_MUTATION);
  const [updateUserRoleMutation] = useMutation(UPDATE_USER_ROLE_MUTATION);
  const [updateUserActiveMutation] = useMutation(UPDATE_USER_ACTIVE_MUTATION);

  // Mapped Data Collections
  const requests: MaintenanceRequest[] = useMemo(() => {
    if (!requestsData?.requests) return [];
    return requestsData.requests.map((r: any) => mapRequest(r, activeUser.id, requestAttachments));
  }, [requestsData, activeUser.id, requestAttachments]);

  const workOrders: WorkOrder[] = useMemo(() => {
    if (!workOrdersData?.workOrders) return [];
    return workOrdersData.workOrders.map((wo: any) => mapWorkOrder(wo));
  }, [workOrdersData]);

  const notifications: NotificationItem[] = useMemo(() => {
    if (!notifData?.notifications) return [];
    return notifData.notifications.map((n: any) => mapNotification(n));
  }, [notifData]);

  const auditLogs: AuditLogEntry[] = useMemo(() => {
    if (!auditData?.auditLogs) return [];
    return auditData.auditLogs.map((l: any) => mapAuditLog(l));
  }, [auditData]);

  const users: UserProfile[] = useMemo(() => {
    if (!usersData?.users) return [];
    return usersData.users.map((u: any) => mapUser(u));
  }, [usersData]);

  const analytics = useMemo(() => {
    if (analyticsData?.analyticsSummary) {
      return analyticsData.analyticsSummary;
    }
    return DEFAULT_ANALYTICS;
  }, [analyticsData]);

  const locations: CampusLocation[] = useMemo(() => {
    if (!locationsData?.locations) return [];
    return locationsData.locations.map((loc: any) => ({
      id: loc.id,
      name: `${loc.name} — ${loc.building}${loc.room ? ' ' + loc.room : ''}`,
      building: loc.building,
      room: loc.room,
      code: loc.code,
    }));
  }, [locationsData]);

  // Operations bound to real NestJS backend mutations
  const createRequest = useCallback(
    async (params: {
      title: string;
      description: string;
      category?: string;
      locationId: string;
      assetId?: string;
      initialSeverity?: number;
      images?: string[];
      user?: UserProfile;
    }) => {
      const res = await createRequestMutation({
        variables: {
          input: {
            title: params.title,
            description: params.description,
            locationId: params.locationId,
            assetId: params.assetId || null,
            initialSeverity: params.initialSeverity || 5,
          },
        },
      });

      const created = res.data?.createRequest;
      if (created?.id && params.images && params.images.length > 0) {
        const nextMap = {
          ...getStoredRequestAttachments(),
          [created.id]: params.images,
          ...(created.requestNumber ? { [created.requestNumber]: params.images } : {}),
        };
        persistRequestAttachments(nextMap);
        setRequestAttachments(nextMap);
      }

      await Promise.all([refetchRequests(), refetchAnalytics()]);
      return created ? { ...created, images: params.images || [] } : created;
    },
    [createRequestMutation, refetchRequests, refetchAnalytics],
  );

  const upvoteRequest = useCallback(
    async (requestId: string) => {
      const res = await upvoteRequestMutation({
        variables: { id: requestId },
      });
      await refetchRequests();
      return res.data?.upvoteRequest;
    },
    [upvoteRequestMutation, refetchRequests],
  );

  const removeUpvote = useCallback(
    async (requestId: string) => {
      const res = await removeUpvoteMutation({
        variables: { id: requestId },
      });
      await refetchRequests();
      return res.data?.removeUpvote;
    },
    [removeUpvoteMutation, refetchRequests],
  );

  const addComment = useCallback(
    async (requestId: string, content: string) => {
      const isInternal = activeUser.role === 'TECHNICIAN' || activeUser.role === 'FACILITY_MANAGER';
      const res = await createCommentMutation({
        variables: {
          input: {
            requestId,
            content,
            isInternal: false,
          },
        },
      });
      await refetchRequests();
      return res.data?.createComment;
    },
    [activeUser.role, createCommentMutation, refetchRequests],
  );

  const overridePriority = useCallback(
    async (requestId: string, newLevel: PriorityLevel, reason: string) => {
      const res = await overridePriorityMutation({
        variables: {
          id: requestId,
          priority: newLevel,
          reason,
        },
      });
      await Promise.all([refetchRequests(), refetchAnalytics()]);
      return res.data?.overridePriority;
    },
    [overridePriorityMutation, refetchRequests, refetchAnalytics],
  );

  const markRequestAsDuplicate = useCallback(
    async (duplicateRequestId: string, originalRequestId: string, reason?: string) => {
      const res = await markDuplicateMutation({
        variables: {
          duplicateRequestId,
          originalRequestId,
          reason: reason || 'Identified as duplicate of active request',
        },
      });
      await Promise.all([refetchRequests(), refetchAnalytics()]);
      return res.data?.markRequestAsDuplicate;
    },
    [markDuplicateMutation, refetchRequests, refetchAnalytics],
  );

  const unmarkRequestDuplicate = useCallback(
    async (duplicateRequestId: string) => {
      const res = await unmarkDuplicateMutation({
        variables: { duplicateRequestId },
      });
      await Promise.all([refetchRequests(), refetchAnalytics()]);
      return res.data?.unmarkRequestDuplicate;
    },
    [unmarkDuplicateMutation, refetchRequests, refetchAnalytics],
  );

  const mergeDuplicates = useCallback(
    async (primaryId: string, dupIds: string[]) => {
      await Promise.all(
        dupIds.map((dupId) =>
          markDuplicateMutation({
            variables: {
              duplicateRequestId: dupId,
              originalRequestId: primaryId,
              reason: `Linked as duplicate of primary request #${primaryId}`,
            },
          }),
        ),
      );
      await Promise.all([refetchRequests(), refetchAnalytics()]);
    },
    [markDuplicateMutation, refetchRequests, refetchAnalytics],
  );

  const uploadAttachment = useCallback(
    async (file: File, requestId?: string, workOrderId?: string) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('fixflow_token') : null;
      const formData = new FormData();
      formData.append('file', file);
      if (requestId) formData.append('requestId', requestId);
      if (workOrderId) formData.append('workOrderId', workOrderId);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/graphql', '') || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/attachments/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.message || 'Attachment upload failed.');
      }

      return await response.json();
    },
    [],
  );

  const createWorkOrder = useCallback(
    async (params: {
      requestId: string;
      technicianId: string;
      slaHours?: number;
      instructions?: string;
    }) => {
      const res = await createWorkOrderMutation({
        variables: {
          input: {
            requestId: params.requestId,
            technicianId: params.technicianId,
            instructions: params.instructions || `Dispatched with ${params.slaHours || 4}h SLA target`,
          },
        },
      });
      await Promise.all([refetchWorkOrders(), refetchRequests(), refetchAnalytics()]);
      return res.data?.createWorkOrder;
    },
    [createWorkOrderMutation, refetchWorkOrders, refetchRequests, refetchAnalytics],
  );

  const updateWorkOrder = useCallback(
    async (
      orderId: string,
      updates: {
        status?: WorkOrderStatus;
        diagnosis?: string;
        repairNotes?: string;
        partsUsed?: WorkOrderPart[];
        afterImages?: string[];
      },
    ) => {
      if (updates.status === 'COMPLETED') {
        const totalCost = updates.partsUsed
          ? updates.partsUsed.reduce(
              (sum, p) => sum + (Number(p.quantity) || 1) * (Number(p.unitCost) || 0),
              0,
            )
          : undefined;

        const res = await completeWorkOrderMutation({
          variables: {
            input: {
              id: orderId,
              resolutionSummary:
                updates.repairNotes || updates.diagnosis || 'Maintenance repair completed',
              partsUsed: updates.partsUsed ? JSON.stringify(updates.partsUsed) : undefined,
              workNotes: updates.diagnosis,
              actualCost: totalCost,
            },
          },
        });
        await Promise.all([refetchWorkOrders(), refetchRequests(), refetchAnalytics()]);
        return res.data?.completeWorkOrder;
      } else {
        const res = await updateWorkOrderStatusMutation({
          variables: {
            input: {
              id: orderId,
              status: updates.status || 'IN_PROGRESS',
              workNotes: updates.diagnosis || updates.repairNotes,
            },
          },
        });
        await Promise.all([refetchWorkOrders(), refetchRequests(), refetchAnalytics()]);
        return res.data?.updateWorkOrderStatus;
      }
    },
    [
      completeWorkOrderMutation,
      updateWorkOrderStatusMutation,
      refetchWorkOrders,
      refetchRequests,
      refetchAnalytics,
    ],
  );

  const verifyWorkOrder = useCallback(
    async (orderId: string, verified: boolean, reason: string) => {
      const res = await verifyWorkOrderMutation({
        variables: {
          input: {
            id: orderId,
            approved: verified,
            notes: reason,
          },
        },
      });
      await Promise.all([refetchWorkOrders(), refetchRequests(), refetchAnalytics()]);
      return res.data?.verifyWorkOrder;
    },
    [verifyWorkOrderMutation, refetchWorkOrders, refetchRequests, refetchAnalytics],
  );

  const detectDuplicates = useCallback(
    (title: string, description: string, category: string, locationId: string): DuplicateCandidate[] => {
      if (!title || title.trim().length < 4) return [];
      const titleLower = title.toLowerCase();
      const words = titleLower.split(/\s+/).filter((w) => w.length > 3);

      return requests
        .filter((r) => {
          if (r.status === 'CLOSED' || r.status === 'CANCELLED') return false;
          const matchLoc = locationId && r.locationId === locationId;
          const rTitle = r.title.toLowerCase();
          const matchWords = words.some((w) => rTitle.includes(w));
          return matchLoc || matchWords;
        })
        .slice(0, 3)
        .map((r) => ({
          requestId: r.id,
          title: r.title,
          similarityScore: r.locationId === locationId ? 92 : 78,
          category: r.category,
          locationName: r.locationName,
          status: r.status,
          upvotes: r.upvotes,
          createdAt: r.reportedAt,
        }));
    },
    [requests],
  );

  const markNotificationRead = useCallback(
    async (notifId: string) => {
      const res = await markNotificationReadMutation({
        variables: { id: notifId },
      });
      await refetchNotifs();
      return res.data?.markNotificationAsRead;
    },
    [markNotificationReadMutation, refetchNotifs],
  );

  const markAllNotificationsRead = useCallback(async () => {
    const res = await markAllNotificationsReadMutation();
    await refetchNotifs();
    return res.data?.markAllNotificationsAsRead;
  }, [markAllNotificationsReadMutation, refetchNotifs]);

  const updateUserRole = useCallback(
    async (userId: string, newRole: UserRole) => {
      const res = await updateUserRoleMutation({
        variables: { id: userId, role: newRole },
      });
      await Promise.all([refetchUsers(), refetchAudit()]);
      return res.data?.updateUserRole;
    },
    [updateUserRoleMutation, refetchUsers, refetchAudit],
  );

  const toggleUserActive = useCallback(
    async (userId: string) => {
      const targetUser = users.find((u) => u.id === userId);
      const nextActive = targetUser ? !targetUser.active : false;
      const res = await updateUserActiveMutation({
        variables: { id: userId, isActive: nextActive },
      });
      await Promise.all([refetchUsers(), refetchAudit()]);
      return res.data?.updateUserActive;
    },
    [users, updateUserActiveMutation, refetchUsers, refetchAudit],
  );

  return {
    requests,
    workOrders,
    notifications,
    auditLogs,
    users,
    analytics,
    activeUser,
    locations,
    loading: requestsLoading || workOrdersLoading,
    error: requestsError,
    // Operations
    createRequest,
    upvoteRequest,
    removeUpvote,
    addComment,
    overridePriority,
    mergeDuplicates,
    markRequestAsDuplicate,
    unmarkRequestDuplicate,
    uploadAttachment,
    createWorkOrder,
    updateWorkOrder,
    verifyWorkOrder,
    detectDuplicates,
    markNotificationRead,
    markAllNotificationsRead,
    updateUserRole,
    toggleUserActive,
  };
}
