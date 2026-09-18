import { InputType, Field, ID, Int } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  Matches,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssetStatus, Criticality } from '../../common/enums';

@InputType({ description: 'Payload for onboarding a new campus asset' })
export class CreateAssetInput {
  @Field(() => String, { description: 'Unique asset identifier, e.g. AST-AC-ENG-101' })
  @IsNotEmpty({ message: 'Asset tag is required' })
  @Matches(/^[A-Z0-9\-_]+$/, {
    message: 'Asset tag must contain only uppercase letters, numbers, hyphens, and underscores',
  })
  assetTag: string;

  @Field(() => String, { description: 'Descriptive name of the equipment' })
  @IsNotEmpty({ message: 'Asset name is required' })
  name: string;

  @Field(() => ID, { description: 'ID of the equipment category' })
  @IsNotEmpty({ message: 'Category ID is required' })
  categoryId: string;

  @Field(() => ID, { description: 'ID of the physical campus location' })
  @IsNotEmpty({ message: 'Location ID is required' })
  locationId: string;

  @Field(() => AssetStatus, {
    nullable: true,
    defaultValue: AssetStatus.OPERATIONAL,
    description: 'Initial operational status',
  })
  @IsOptional()
  @IsEnum(AssetStatus, { message: 'Invalid asset status' })
  status?: AssetStatus;

  @Field(() => Criticality, {
    nullable: true,
    defaultValue: Criticality.MEDIUM,
    description: 'Operational criticality level',
  })
  @IsOptional()
  @IsEnum(Criticality, { message: 'Invalid criticality level' })
  criticality?: Criticality;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 5,
    description: 'Condition rating from 1 to 5',
  })
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

  @Field(() => String, {
    nullable: true,
    description: 'Custom QR identifier (generated automatically if omitted)',
  })
  @IsOptional()
  qrIdentifier?: string;
}
