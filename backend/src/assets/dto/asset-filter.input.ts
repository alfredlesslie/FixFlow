import { InputType, Field, ID } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';
import { AssetStatus, Criticality } from '../../common/enums';

@InputType({ description: 'Filter and search criteria for querying assets' })
export class AssetFilterInput {
  @Field(() => String, {
    nullable: true,
    description: 'Fuzzy search across name, assetTag, manufacturer, and serialNumber',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @Field(() => ID, { nullable: true, description: 'Filter by category ID' })
  @IsOptional()
  categoryId?: string;

  @Field(() => ID, { nullable: true, description: 'Filter by campus location ID' })
  @IsOptional()
  locationId?: string;

  @Field(() => AssetStatus, { nullable: true, description: 'Filter by operational status' })
  @IsOptional()
  status?: AssetStatus;

  @Field(() => Criticality, { nullable: true, description: 'Filter by criticality level' })
  @IsOptional()
  criticality?: Criticality;
}
