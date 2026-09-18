import { InputType, Field, ID, Int } from '@nestjs/graphql';
import {
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssetStatus, Criticality } from '../../common/enums';

@InputType({ description: 'Payload for updating an existing campus asset' })
export class UpdateAssetInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  name?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  categoryId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  locationId?: string;

  @Field(() => AssetStatus, { nullable: true })
  @IsOptional()
  @IsEnum(AssetStatus, { message: 'Invalid asset status' })
  status?: AssetStatus;

  @Field(() => Criticality, { nullable: true })
  @IsOptional()
  @IsEnum(Criticality, { message: 'Invalid criticality level' })
  criticality?: Criticality;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt({ message: 'Condition rating must be an integer' })
  @Min(1, { message: 'Condition rating must be between 1 and 5' })
  @Max(5, { message: 'Condition rating must be between 1 and 5' })
  conditionRating?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  description?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  serialNumber?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  manufacturer?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  model?: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Invalid installation date format' })
  installationDate?: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Invalid warranty expiry date format' })
  warrantyExpiry?: Date;
}
