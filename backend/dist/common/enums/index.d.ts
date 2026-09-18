import { Role, AssetStatus, Criticality, Priority, RequestStatus, WorkOrderStatus } from '@prisma/client';
export declare enum ScheduleStatus {
    UPCOMING = "UPCOMING",
    DUE = "DUE",
    OVERDUE = "OVERDUE",
    COMPLETED = "COMPLETED"
}
export { Role, AssetStatus, Criticality, Priority, RequestStatus, WorkOrderStatus, };
