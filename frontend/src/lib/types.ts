export type UserRole = 'REQUESTER' | 'TECHNICIAN' | 'FACILITY_MANAGER' | 'ADMIN';

export type RequestStatus =
  | 'OPEN'
  | 'TRIAGED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'VERIFIED'
  | 'CLOSED'
  | 'REOPENED'
  | 'CANCELLED';

export type WorkOrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CANCELLED';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar?: string;
  active: boolean;
  phone?: string;
}

export interface PriorityFactors {
  initialSeverity: number; // 1-10
  assetCriticality: number; // 1-10
  upvoteMultiplier: number; // calculated from votes
  unresolvedHoursWeight: number; // calculated from age
  recurringMultiplier: number; // repeated reports in same location/asset
  calculatedScore: number; // 0 - 100
  level: PriorityLevel;
  isOverridden: boolean;
  overrideReason?: string;
  overriddenBy?: string;
  overriddenAt?: string;
}

export interface RequestComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
  isSystemEvent?: boolean;
}

export interface MaintenanceRequest {
  id: string;
  requestNumber: string;
  title: string;
  description: string;
  category: string;
  locationId: string;
  locationName: string;
  building?: string;
  floor?: string;
  room?: string;
  assetId?: string;
  assetTag?: string;
  assetName?: string;
  reportedById: string;
  reportedByName: string;
  reportedByRole: UserRole;
  reportedAt: string;
  status: RequestStatus;
  priority: PriorityLevel;
  priorityFactors: PriorityFactors;
  upvotes: number;
  upvoters: string[]; // user IDs
  images: string[];
  comments: RequestComment[];
  workOrderId?: string;
  isDuplicate?: boolean;
  duplicateOfId?: string;
  mergedDuplicates?: string[]; // IDs of merged child requests
  clarificationRequested?: boolean;
  clarificationMessage?: string;
  updatedAt: string;
}

export interface WorkOrderPart {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
}

export interface WorkOrder {
  id: string;
  orderNumber: string;
  requestId: string;
  requestTitle: string;
  category: string;
  locationName: string;
  assetName?: string;
  assignedToId: string;
  assignedToName: string;
  assignedToEmail: string;
  status: WorkOrderStatus;
  priority: PriorityLevel;
  slaDeadline: string; // ISO date
  slaHoursRemaining?: number;
  isOverdue?: boolean;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  diagnosis?: string;
  repairNotes?: string;
  partsUsed: WorkOrderPart[];
  beforeImages: string[];
  afterImages: string[];
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'assignment' | 'sla' | 'verification' | 'duplicate' | 'status' | 'comment';
  createdAt: string;
  read: boolean;
  targetId?: string;
  targetType?: 'request' | 'workOrder';
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: 'REQUEST' | 'WORK_ORDER' | 'PRIORITY' | 'USER' | 'SYSTEM' | 'ASSET';
  entityId: string;
  details: string;
  performedById: string;
  performedByName: string;
  performedByRole: UserRole;
  createdAt: string;
}

export interface DuplicateCandidate {
  requestId: string;
  title: string;
  similarityScore: number; // 0 - 100%
  category: string;
  locationName: string;
  status: RequestStatus;
  upvotes: number;
  createdAt: string;
}
