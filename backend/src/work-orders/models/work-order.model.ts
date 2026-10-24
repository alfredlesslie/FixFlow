import { Field, ID, Float, ObjectType } from '@nestjs/graphql';
import { WorkOrderStatus } from '../../common/enums';
import { MaintenanceRequest } from '../../requests/models/maintenance-request.model';
import { Asset } from '../../assets/models/asset.model';
import { User } from '../../users/models/user.model';
import { WorkOrderHandover } from './work-order-handover.model';
import { MaintenanceRecord } from './maintenance-record.model';

@ObjectType({ description: 'Technician dispatched work order and repair lifecycle' })
export class WorkOrder {
  @Field(() => ID)
  id: string;

  @Field(() => String, { description: 'Unique institutional work order number, e.g. WO-2026-0001' })
  orderNumber: string;

  @Field(() => String)
  requestId: string;

  @Field(() => String, { nullable: true })
  assetId?: string | null;

  @Field(() => String, { nullable: true })
  technicianId?: string | null;

  @Field(() => WorkOrderStatus, { description: 'Current execution status: PENDING, ACCEPTED, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED' })
  status: WorkOrderStatus;

  @Field(() => String, { nullable: true, description: 'Manager instructions and special safety protocols' })
  instructions?: string | null;

  @Field(() => String, { nullable: true, description: 'Technician ongoing diagnostic logs and work notes' })
  workNotes?: string | null;

  @Field(() => String, { nullable: true, description: 'Post-completion summary of repair actions' })
  resolutionSummary?: string | null;

  @Field(() => String, { nullable: true, description: 'Itemized or serialized spare parts consumed' })
  partsUsed?: string | null;

  @Field(() => Float, { nullable: true, description: 'Initial estimated repair expenditure' })
  estimatedCost?: number | null;

  @Field(() => Float, { nullable: true, description: 'Final actual parts and materials expenditure' })
  actualCost?: number | null;

  @Field(() => Date, { nullable: true, description: 'Timestamp when technician commenced physical work' })
  startedAt?: Date | null;

  @Field(() => Date, { nullable: true, description: 'Timestamp when technician completed physical repair' })
  completedAt?: Date | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => MaintenanceRequest, { nullable: true, description: 'Associated campus maintenance request' })
  request?: MaintenanceRequest | null;

  @Field(() => Asset, { nullable: true, description: 'Associated equipment asset' })
  asset?: Asset | null;

  @Field(() => User, { nullable: true, description: 'Assigned certified technician' })
  technician?: User | null;

  @Field(() => [WorkOrderHandover], { defaultValue: [], description: 'Shift transition and technician handover trail' })
  handovers?: WorkOrderHandover[];

  @Field(() => [MaintenanceRecord], { defaultValue: [], description: 'Recorded maintenance action logs' })
  records?: MaintenanceRecord[];
}
