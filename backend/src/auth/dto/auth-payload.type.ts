import { ObjectType, Field } from '@nestjs/graphql';
import { User } from '../../users/models/user.model';

@ObjectType({ description: 'Authentication result containing JWT token and user profile' })
export class AuthPayload {
  @Field(() => String, { description: 'Stateless JWT Bearer access token' })
  accessToken: string;

  @Field(() => User, { description: 'Authenticated user profile' })
  user: User;
}
