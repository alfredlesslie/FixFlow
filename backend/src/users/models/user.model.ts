import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Role } from '../../common/enums';

@ObjectType({ description: 'FixFlow institutional user profile' })
export class User {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  email: string;

  @Field(() => String)
  firstName: string;

  @Field(() => String)
  lastName: string;

  @Field(() => String, { description: 'Full combined name' })
  name: string;

  @Field(() => Role)
  role: Role;

  @Field(() => String, { nullable: true })
  department?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
