import { registerEnumType } from '@nestjs/graphql';
import {
  Role,
  AssetStatus,
  Criticality,
  Priority,
  RequestStatus,
  WorkOrderStatus,
  AccountStatus,
  ApplicationStatus,
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
  AccountStatus,
  ApplicationStatus,
};

registerEnumType(Role, {
  name: 'Role',
  description: 'User access control roles in FixFlow',
});

registerEnumType(AccountStatus, {
  name: 'AccountStatus',
  description: 'Lifecycle state of an institutional account in FixFlow',
});

registerEnumType(ApplicationStatus, {
  name: 'ApplicationStatus',
  description: 'Review status of an institutional role application',
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
