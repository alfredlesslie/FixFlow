import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { WorkOrderStatus } from '../../common/enums';

@InputType({ description: 'Payload for updating operational progress on an active work order' })
export class UpdateWorkOrderStatusInput {
  @Field(() => ID)
  @IsNotEmpty({ message: 'Work order ID is required' })
  @IsString()
  id: string;

  @Field(() => WorkOrderStatus)
  @IsNotEmpty({ message: 'Status is required' })
  @IsEnum(WorkOrderStatus)
  status: WorkOrderStatus;

  @Field(() => String, { nullable: true, description: 'Technician ongoing diagnostic logs and observations' })
  @IsOptional()
  @IsString()
  workNotes?: string;
}
