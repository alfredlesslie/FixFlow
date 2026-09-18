import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Asset category classification and maintenance intervals' })
export class AssetCategory {
  @Field(() => ID)
  id: string;

  @Field(() => String, { description: 'Category name, e.g. HVAC, Electrical' })
  name: string;

  @Field(() => String, { description: 'Unique category code' })
  code: string;

  @Field(() => String, { nullable: true, description: 'Category scope description' })
  description?: string | null;

  @Field(() => Int, {
    description: 'Default frequency in days for preventive maintenance cycles',
  })
  defaultMaintenanceIntervalDays: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
