import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/login.input';
import { AuthPayload } from './dto/auth-payload.type';
import { User } from '../users/models/user.model';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload, {
    description: 'Authenticate an institutional user and issue a JWT Bearer token',
  })
  async login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    return this.authService.login(input);
  }

  @Query(() => User, {
    name: 'me',
    description: 'Retrieve profile details of the currently authenticated user',
  })
  @UseGuards(GqlAuthGuard)
  async getMe(@CurrentUser() user: User): Promise<User> {
    return user;
  }
}
