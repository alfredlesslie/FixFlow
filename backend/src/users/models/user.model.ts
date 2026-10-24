import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Role, AccountStatus } from '../../common/enums';

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

  @Field(() => AccountStatus, { description: 'Account lifecycle state' })
  status: AccountStatus;

  @Field(() => Boolean, { description: 'Whether institutional email ownership is verified' })
  emailVerified: boolean;

  @Field(() => Date, { nullable: true, description: 'Timestamp when email ownership was verified' })
  emailVerifiedAt?: Date | null;

  // Internal session invalidation token version (omitted from GraphQL response schema)
  tokenVersion: number;

  @Field(() => String, { nullable: true, description: 'Institutional roll or employee ID' })
  institutionalId?: string | null;

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
