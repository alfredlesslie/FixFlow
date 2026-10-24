import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, Min, Max, Length } from 'class-validator';

@InputType({ description: 'Payload for reporting a new campus maintenance request' })
export class CreateRequestInput {
  @Field(() => String, { description: 'Concise summary of the maintenance issue' })
  @IsNotEmpty({ message: 'Title is required' })
  @IsString({ message: 'Title must be a valid string' })
  @Length(3, 150, { message: 'Title must be between 3 and 150 characters' })
  title: string;

  @Field(() => String, { description: 'Detailed problem description and symptoms' })
  @IsNotEmpty({ message: 'Description is required' })
  @IsString({ message: 'Description must be a valid string' })
  @Length(5, 2000, { message: 'Description must be between 5 and 2000 characters' })
  description: string;

  @Field(() => ID, { description: 'ID of the physical campus location' })
  @IsNotEmpty({ message: 'Location ID is required' })
  @IsString({ message: 'Location ID must be a valid string identifier' })
  locationId: string;

  @Field(() => ID, {
    nullable: true,
    description: 'Optional ID of the specific affected campus asset',
  })
  @IsOptional()
  @IsString({ message: 'Asset ID must be a valid string identifier' })
  assetId?: string;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 5,
    description: 'Initial reported severity assessment from 1 (minor) to 10 (critical emergency)',
  })
  @IsOptional()
  @Min(1, { message: 'Initial severity must be at least 1' })
  @Max(10, { message: 'Initial severity cannot exceed 10' })
  initialSeverity?: number;
}
