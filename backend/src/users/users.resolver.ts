import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { UseGuards, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './models/user.model';
import { Role } from '../common/enums';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [User], {
    name: 'users',
    description: 'List institutional users (restricted to ADMIN and FACILITY_MANAGER)',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.FACILITY_MANAGER)
  async getUsers(
    @Args('role', { type: () => Role, nullable: true }) role?: Role,
  ): Promise<User[]> {
    return this.usersService.findAll(role);
  }

  @Query(() => User, {
    name: 'user',
    description: 'Retrieve user details by ID',
  })
  @UseGuards(GqlAuthGuard)
  async getUser(@Args('id', { type: () => ID }) id: string): Promise<User> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
}
