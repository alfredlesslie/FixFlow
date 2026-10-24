import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/models/user.model';
import { AccountStatus } from '../../common/enums';

@ObjectType({ description: 'Result of an institutional registration submission' })
export class RegistrationResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => String)
  message: string;

  @Field(() => AccountStatus)
  status: AccountStatus;

  @Field(() => Boolean, { nullable: true, description: 'Indicates whether the verification email was accepted by the mail provider' })
  emailDispatched?: boolean;

  @Field(() => User, { nullable: true })
  user?: User | null;

  @Field(() => ID, { nullable: true })
  applicationId?: string | null;
}

@ObjectType({ description: 'Result of email verification' })
export class VerifyEmailResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => String)
  message: string;

  @Field(() => AccountStatus)
  status: AccountStatus;

  @Field(() => User, { nullable: true })
  user?: User | null;
}

@ObjectType({ description: 'Result of generic authentication operation' })
export class OperationStatusResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => String)
  message: string;

  @Field(() => Boolean, { nullable: true, description: 'Indicates whether the verification email was accepted by the mail provider' })
  emailDispatched?: boolean;
}
