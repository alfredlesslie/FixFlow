import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from '../../users/models/user.model';

@ObjectType({ description: 'Technician shift transition and responsibility handover record' })
export class WorkOrderHandover {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  workOrderId: string;

  @Field(() => String, { nullable: true })
  previousTechId?: string | null;

  @Field(() => String)
  nextTechId: string;

  @Field(() => String, { description: 'Technical context notes and diagnostics handed over' })
  handoverNotes: string;

  @Field(() => String, { nullable: true, description: 'Administrative reason for handover' })
  reason?: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => User, { nullable: true })
  previousTech?: User | null;

  @Field(() => User)
  nextTech: User;
}
