import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './models/user.model';
import { Role } from '../common/enums';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @ResolveField(() => String, { name: 'name', description: 'Full combined name' })
  getName(@Parent() user: any): string {
    if (user.name) return user.name;
    const first = user.firstName || '';
    const last = user.lastName || '';
    const combined = `${first} ${last}`.trim();
    return combined || user.email || 'Campus User';
  }

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
    description: 'Retrieve user details by ID (Self-view or Admin/Facility Manager only)',
  })
  @UseGuards(GqlAuthGuard)
  async getUser(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    // Ordinary users can retrieve only their own profile; cross-user retrieval requires ADMIN or FACILITY_MANAGER
    if (id !== currentUser.id && currentUser.role !== Role.ADMIN && currentUser.role !== Role.FACILITY_MANAGER) {
      throw new ForbiddenException('You are not authorized to view another user profile');
    }

    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @Mutation(() => User, {
    description: 'Update user institutional access role (Admin only)',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateUserRole(
    @Args('id', { type: () => ID }) id: string,
    @Args('role', { type: () => Role }) role: Role,
    @CurrentUser() admin: User,
  ): Promise<User> {
    return this.usersService.updateUserRole(id, role, admin.id);
  }

  @Mutation(() => User, {
    description: 'Update user active state / account suspension (Admin only)',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateUserActive(
    @Args('id', { type: () => ID }) id: string,
    @Args('isActive', { type: () => Boolean }) isActive: boolean,
    @CurrentUser() admin: User,
  ): Promise<User> {
    return this.usersService.updateUserActive(id, isActive, admin.id);
  }
}
