'use client';

import { useState, useEffect, useMemo } from 'react';
import { dataBridge, SEED_USERS } from './data-bridge';
import { useAuth } from './auth-context';
import {
  MaintenanceRequest,
  WorkOrder,
  NotificationItem,
  AuditLogEntry,
  UserProfile,
  UserRole,
} from './types';

export function useDataBridge() {
  const { user: authUser } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [users, setUsers] = useState<UserProfile[]>(SEED_USERS);
  const [analytics, setAnalytics] = useState(dataBridge.getAnalytics());

  // Derive active persona strictly from trusted authentication session
  const activeUser: UserProfile = useMemo(() => {
    if (!authUser) return SEED_USERS[0];
    const foundByEmail = dataBridge
      .getUsers()
      .find((u) => u.email.toLowerCase() === authUser.email.toLowerCase());
    if (foundByEmail) return foundByEmail;

    const foundByRole = dataBridge.getUsers().find((u) => u.role === authUser.role);
    if (foundByRole) {
      return {
        ...foundByRole,
        id: authUser.id || foundByRole.id,
        name: authUser.name || foundByRole.name,
        email: authUser.email || foundByRole.email,
        department: authUser.department || foundByRole.department,
      };
    }

    return {
      id: authUser.id,
      name: authUser.name,
      email: authUser.email,
      role: authUser.role as UserRole,
      department: authUser.department || 'Campus Facilities',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      active: true,
    };
  }, [authUser]);

  useEffect(() => {
    // Load initial state
    setRequests(dataBridge.getRequests());
    setWorkOrders(dataBridge.getWorkOrders());
    setNotifications(dataBridge.getNotifications(activeUser.id));
    setAuditLogs(dataBridge.getAuditLogs());
    setUsers(dataBridge.getUsers());
    setAnalytics(dataBridge.getAnalytics());

    const unsubscribe = dataBridge.subscribe(() => {
      setRequests(dataBridge.getRequests());
      setWorkOrders(dataBridge.getWorkOrders());
      setNotifications(dataBridge.getNotifications(activeUser.id));
      setAuditLogs(dataBridge.getAuditLogs());
      setUsers(dataBridge.getUsers());
      setAnalytics(dataBridge.getAnalytics());
    });

    return () => {
      unsubscribe();
    };
  }, [activeUser.id]);

  return {
    requests,
    workOrders,
    notifications,
    auditLogs,
    users,
    analytics,
    activeUser,
    // Operations
    createRequest: (params: Parameters<typeof dataBridge.createRequest>[0]) =>
      dataBridge.createRequest(params),
    upvoteRequest: (requestId: string) =>
      dataBridge.upvoteRequest(requestId, activeUser.id),
    addComment: (requestId: string, content: string) =>
      dataBridge.addComment(requestId, activeUser, content),
    overridePriority: (requestId: string, newLevel: Parameters<typeof dataBridge.overridePriority>[1], reason: string) =>
      dataBridge.overridePriority(requestId, newLevel, reason, activeUser),
    mergeDuplicates: (primaryId: string, dupIds: string[]) =>
      dataBridge.mergeDuplicates(primaryId, dupIds, activeUser),
    createWorkOrder: (params: { requestId: string; technicianId: string; slaHours: number }) =>
      dataBridge.createWorkOrder({ ...params, manager: activeUser }),
    updateWorkOrder: (orderId: string, updates: Parameters<typeof dataBridge.updateWorkOrder>[1]) =>
      dataBridge.updateWorkOrder(orderId, updates, activeUser),
    verifyWorkOrder: (orderId: string, verified: boolean, reason: string) =>
      dataBridge.verifyWorkOrder(orderId, verified, reason, activeUser),
    detectDuplicates: (title: string, description: string, category: string, locationId: string) =>
      dataBridge.detectDuplicates(title, description, category, locationId),
    markNotificationRead: (notifId: string) =>
      dataBridge.markNotificationRead(notifId),
    markAllNotificationsRead: () =>
      dataBridge.markAllNotificationsRead(activeUser.id),
    updateUserRole: (userId: string, newRole: UserRole) =>
      dataBridge.updateUserRole(userId, newRole, activeUser),
    toggleUserActive: (userId: string) =>
      dataBridge.toggleUserActive(userId, activeUser),
  };
}
