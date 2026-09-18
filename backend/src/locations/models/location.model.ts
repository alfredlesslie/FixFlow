import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Campus building, wing, or laboratory location' })
export class Location {
  @Field(() => ID)
  id: string;

  @Field(() => String, { description: 'Unique identifier code, e.g. ENG-BLD-101' })
  code: string;

  @Field(() => String, { description: 'Descriptive location name' })
  name: string;

  @Field(() => String, { description: 'Campus building name' })
  building: string;

  @Field(() => String, { description: 'Floor level' })
  floor: string;

  @Field(() => String, { nullable: true, description: 'Room or hall number' })
  roomNumber?: string | null;

  @Field(() => String, { nullable: true, description: 'Additional location remarks' })
  description?: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
