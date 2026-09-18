import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { AssetStatus, Criticality } from '../../common/enums';
import { AssetCategory } from '../../asset-categories/models/asset-category.model';
import { Location } from '../../locations/models/location.model';

@ObjectType({ description: 'Institutional campus asset specification and operational lifecycle' })
export class Asset {
  @Field(() => ID)
  id: string;

  @Field(() => String, { description: 'Unique institutional asset tag, e.g. AST-AC-ENG-101' })
  assetTag: string;

  @Field(() => String, { description: 'Descriptive asset name' })
  name: string;

  @Field(() => String, { nullable: true, description: 'Asset specifications and operational notes' })
  description?: string | null;

  @Field(() => String)
  categoryId: string;

  @Field(() => String)
  locationId: string;

  @Field(() => AssetStatus, { description: 'Operational status: OPERATIONAL, UNDER_MAINTENANCE, OUT_OF_SERVICE, RETIRED' })
  status: AssetStatus;

  @Field(() => Criticality, { description: 'Institutional criticality: LOW, MEDIUM, HIGH, CRITICAL' })
  criticality: Criticality;

  @Field(() => Int, { description: 'Condition assessment rating from 1 (Critical/Failing) to 5 (Excellent)' })
  conditionRating: number;

  @Field(() => String, { nullable: true })
  serialNumber?: string | null;

  @Field(() => String, { nullable: true })
  manufacturer?: string | null;

  @Field(() => String, { nullable: true })
  model?: string | null;

  @Field(() => Date, { nullable: true })
  installationDate?: Date | null;

  @Field(() => Date, { nullable: true })
  warrantyExpiry?: Date | null;

  @Field(() => String, { description: 'Stable unique public/internal QR code target URI' })
  qrIdentifier: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => AssetCategory, { description: 'Classified equipment category' })
  category: AssetCategory;

  @Field(() => Location, { description: 'Physical campus housing location' })
  location: Location;
}
