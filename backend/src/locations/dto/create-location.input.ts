import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Matches } from 'class-validator';

@InputType({ description: 'Payload for registering a new campus location' })
export class CreateLocationInput {
  @Field(() => String, { description: 'Unique location code, e.g. ENG-BLD-101' })
  @IsNotEmpty({ message: 'Location code is required' })
  @Matches(/^[A-Z0-9\-_]+$/, {
    message: 'Location code must contain only uppercase letters, numbers, hyphens, and underscores',
  })
  code: string;

  @Field(() => String, { description: 'Human-readable location name' })
  @IsNotEmpty({ message: 'Location name is required' })
  name: string;

  @Field(() => String, { description: 'Campus building name' })
  @IsNotEmpty({ message: 'Building name is required' })
  building: string;

  @Field(() => String, { description: 'Floor level' })
  @IsNotEmpty({ message: 'Floor level is required' })
  floor: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  roomNumber?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  description?: string;
}
