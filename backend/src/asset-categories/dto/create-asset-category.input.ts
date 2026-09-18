import { InputType, Field, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsInt, Min, Matches } from 'class-validator';

@InputType({ description: 'Payload for creating a new asset classification category' })
export class CreateAssetCategoryInput {
  @Field(() => String, { description: 'Unique category identifier code, e.g. HVAC' })
  @IsNotEmpty({ message: 'Category code is required' })
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'Category code must contain only uppercase letters, numbers, and underscores',
  })
  code: string;

  @Field(() => String, { description: 'Descriptive category name' })
  @IsNotEmpty({ message: 'Category name is required' })
  name: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  description?: string;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 90,
    description: 'Default preventive maintenance cycle in days',
  })
  @IsOptional()
  @IsInt({ message: 'Maintenance interval must be an integer' })
  @Min(1, { message: 'Maintenance interval must be at least 1 day' })
  defaultMaintenanceIntervalDays?: number;
}
