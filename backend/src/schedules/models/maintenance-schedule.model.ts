import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Asset } from '../../assets/models/asset.model';

@ObjectType({ description: 'Institutional preventive maintenance schedule' })
export class MaintenanceSchedule {
  @Field(() => ID)
  id: string;

  @Field(() => String, { description: 'Scheduled maintenance task title' })
  title: string;

  @Field(() => String, { nullable: true, description: 'Task protocol and instructions' })
  description?: string | null;

  @Field(() => String)
  assetId: string;

  @Field(() => Int, { description: 'Recurring frequency in days' })
  frequencyDays: number;

  @Field(() => Date, { nullable: true })
  lastCompletedDate?: Date | null;

  @Field(() => Date, { description: 'Target date when next preventive cycle is due' })
  nextDueDate: Date;

  @Field(() => Boolean)
  isEnabled: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => Asset, { nullable: true, description: 'Target campus equipment asset' })
  asset?: Asset | null;
}
