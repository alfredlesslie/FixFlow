import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsInt, Min } from 'class-validator';

@InputType({ description: 'Payload for updating an existing asset category' })
export class UpdateAssetCategoryInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  description?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt({ message: 'Maintenance interval must be an integer' })
  @Min(1, { message: 'Maintenance interval must be at least 1 day' })
  defaultMaintenanceIntervalDays?: number;
}
