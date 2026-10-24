import { Field, ID, Float, ObjectType } from '@nestjs/graphql';
import { User } from '../../users/models/user.model';

@ObjectType({ description: 'Permanent equipment maintenance history record' })
export class MaintenanceRecord {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  assetId: string;

  @Field(() => String, { nullable: true })
  workOrderId?: string | null;

  @Field(() => String)
  technicianId: string;

  @Field(() => String, { description: 'Action taken on the equipment' })
  actionTaken: string;

  @Field(() => String, { nullable: true, description: 'Detailed diagnostic and repair observations' })
  repairDetails?: string | null;

  @Field(() => String, { nullable: true, description: 'List or description of replaced components' })
  partsReplaced?: string | null;

  @Field(() => Float, { nullable: true, description: 'Total parts and labor expense incurred' })
  cost?: number | null;

  @Field(() => Date)
  dateCompleted: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => User, { nullable: true })
  technician?: User | null;
}
