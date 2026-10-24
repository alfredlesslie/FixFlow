import { InputType, Field, ID } from '@nestjs/graphql';
import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { WorkOrderStatus } from '../../common/enums';

@InputType({ description: 'Filter criteria for querying technician work orders' })
export class WorkOrderFilterInput {
  @Field(() => WorkOrderStatus, { nullable: true })
  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;

  @Field(() => ID, { nullable: true, description: 'Filter by assigned technician ID' })
  @IsOptional()
  @IsString()
  technicianId?: string;

  @Field(() => ID, { nullable: true, description: 'Filter by maintenance request ID' })
  @IsOptional()
  @IsString()
  requestId?: string;

  @Field(() => Boolean, { nullable: true, description: 'Filter only work orders assigned to current technician' })
  @IsOptional()
  @IsBoolean()
  myWorkOnly?: boolean;
}
