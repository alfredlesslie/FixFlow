import { registerEnumType } from '@nestjs/graphql';
import {
  Role,
  AssetStatus,
  Criticality,
  Priority,
  RequestStatus,
  WorkOrderStatus,
} from '@prisma/client';

export enum ScheduleStatus {
  UPCOMING = 'UPCOMING',
  DUE = 'DUE',
  OVERDUE = 'OVERDUE',
  COMPLETED = 'COMPLETED',
}

export {
  Role,
  AssetStatus,
  Criticality,
  Priority,
  RequestStatus,
  WorkOrderStatus,
};

registerEnumType(Role, {
  name: 'Role',
  description: 'User access control roles in FixFlow',
});

registerEnumType(AssetStatus, {
  name: 'AssetStatus',
  description: 'Operational lifecycle status of campus assets',
});

registerEnumType(Criticality, {
  name: 'Criticality',
  description: 'Criticality level of campus equipment',
});

registerEnumType(Priority, {
  name: 'Priority',
  description: 'Maintenance request priority level',
});

registerEnumType(RequestStatus, {
  name: 'RequestStatus',
  description: 'Maintenance request lifecycle state',
});

registerEnumType(WorkOrderStatus, {
  name: 'WorkOrderStatus',
  description: 'Technician work order state',
});

registerEnumType(ScheduleStatus, {
  name: 'ScheduleStatus',
  description: 'Preventive maintenance schedule state',
});
