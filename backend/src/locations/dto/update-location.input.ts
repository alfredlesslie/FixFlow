import { InputType, Field } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

@InputType({ description: 'Payload for updating an existing campus location' })
export class UpdateLocationInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  building?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  floor?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  roomNumber?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  description?: string;
}
