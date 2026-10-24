import { InputType, Field, ID } from '@nestjs/graphql';
import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { Priority, RequestStatus } from '../../common/enums';

@InputType({ description: 'Filter and search criteria for querying maintenance requests' })
export class RequestFilterInput {
  @Field(() => String, {
    nullable: true,
    description: 'Fuzzy search across title, description, and requestNumber',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @Field(() => RequestStatus, {
    nullable: true,
    description: 'Filter by request lifecycle state',
  })
  @IsOptional()
  @IsEnum(RequestStatus, { message: 'Invalid request status filter' })
  status?: RequestStatus;

  @Field(() => Priority, {
    nullable: true,
    description: 'Filter by derived priority level',
  })
  @IsOptional()
  @IsEnum(Priority, { message: 'Invalid priority filter' })
  priority?: Priority;

  @Field(() => ID, {
    nullable: true,
    description: 'Filter by campus location ID',
  })
  @IsOptional()
  @IsString()
  locationId?: string;

  @Field(() => ID, {
    nullable: true,
    description: 'Filter by campus asset ID',
  })
  @IsOptional()
  @IsString()
  assetId?: string;

  @Field(() => ID, {
    nullable: true,
    description: 'Filter by equipment category ID',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @Field(() => ID, {
    nullable: true,
    description: 'Filter by requester user ID',
  })
  @IsOptional()
  @IsString()
  requesterId?: string;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Filter only requests reported by the current authenticated user',
  })
  @IsOptional()
  @IsBoolean()
  myReportsOnly?: boolean;
}
