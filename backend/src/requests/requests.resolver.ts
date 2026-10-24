import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { MaintenanceRequest } from './models/maintenance-request.model';
import { CreateRequestInput } from './dto/create-request.input';
import { RequestFilterInput } from './dto/request-filter.input';
import { Role, Priority } from '../common/enums';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/models/user.model';

@Resolver(() => MaintenanceRequest)
export class RequestsResolver {
  constructor(private readonly requestsService: RequestsService) {}

  @Query(() => [MaintenanceRequest], {
    name: 'requests',
    description: 'Retrieve campus maintenance requests with multi-criteria filtering and text search',
  })
  @UseGuards(GqlAuthGuard)
  async getRequests(
    @Args('filter', { type: () => RequestFilterInput, nullable: true })
    filter?: RequestFilterInput,
    @CurrentUser() user?: User,
  ): Promise<MaintenanceRequest[]> {
    return this.requestsService.findAll(filter, user);
  }

  @Query(() => MaintenanceRequest, {
    name: 'request',
    description: 'Retrieve complete maintenance request details by unique ID',
  })
  @UseGuards(GqlAuthGuard)
  async getRequest(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user?: User,
  ): Promise<MaintenanceRequest> {
    return this.requestsService.findById(id, user);
  }

  @Mutation(() => MaintenanceRequest, {
    description: 'Submit a new campus maintenance request with server-derived priority and SLA',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.REQUESTER, Role.FACILITY_MANAGER, Role.ADMIN)
  async createRequest(
    @Args('input') input: CreateRequestInput,
    @CurrentUser() user: User,
  ): Promise<MaintenanceRequest> {
    return this.requestsService.create(input, user);
  }

  @Mutation(() => MaintenanceRequest, {
    description: 'Upvote an active maintenance request to signal community impact',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.REQUESTER, Role.TECHNICIAN, Role.FACILITY_MANAGER, Role.ADMIN)
  async upvoteRequest(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<MaintenanceRequest> {
    return this.requestsService.upvote(id, user);
  }

  @Query(() => [MaintenanceRequest], {
    name: 'suggestDuplicateRequests',
    description: 'Find similar active requests to prevent duplicate submissions',
  })
  @UseGuards(GqlAuthGuard)
  async suggestDuplicateRequests(
    @Args('title', { type: () => String }) title: string,
    @Args('locationId', { type: () => ID, nullable: true }) locationId?: string,
  ): Promise<MaintenanceRequest[]> {
    return this.requestsService.suggestDuplicates(title, locationId);
  }

  @Mutation(() => MaintenanceRequest, {
    description: 'Manually override maintenance request priority (Facility Manager or Admin only)',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.FACILITY_MANAGER, Role.ADMIN)
  async overridePriority(
    @Args('id', { type: () => ID }) id: string,
    @Args('priority', { type: () => Priority }) priority: Priority,
    @Args('reason', { type: () => String }) reason: string,
    @CurrentUser() user: User,
  ): Promise<MaintenanceRequest> {
    return this.requestsService.overridePriority(id, priority, reason, user);
  }

  @Mutation(() => MaintenanceRequest, {
    description: 'Reopen a previously resolved or closed maintenance request',
  })
  @UseGuards(GqlAuthGuard)
  async reopenRequest(
    @Args('id', { type: () => ID }) id: string,
    @Args('reason', { type: () => String }) reason: string,
    @CurrentUser() user: User,
  ): Promise<MaintenanceRequest> {
    return this.requestsService.reopenRequest(id, reason, user);
  }

  @Mutation(() => MaintenanceRequest, {
    description: 'Remove an upvote from a maintenance request',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.REQUESTER, Role.TECHNICIAN, Role.FACILITY_MANAGER, Role.ADMIN)
  async removeUpvote(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<MaintenanceRequest> {
    return this.requestsService.removeUpvote(id, user);
  }

  @Mutation(() => MaintenanceRequest, {
    description: 'Mark a maintenance request as a duplicate of another primary request',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.TECHNICIAN, Role.FACILITY_MANAGER, Role.ADMIN)
  async markRequestAsDuplicate(
    @Args('duplicateRequestId', { type: () => ID }) duplicateRequestId: string,
    @Args('originalRequestId', { type: () => ID }) originalRequestId: string,
    @Args('reason', { type: () => String, nullable: true }) reason: string,
    @CurrentUser() user: User,
  ): Promise<MaintenanceRequest> {
    return this.requestsService.markDuplicate(duplicateRequestId, originalRequestId, reason, user);
  }

  @Mutation(() => MaintenanceRequest, {
    description: 'Unmark a duplicate maintenance request, restoring it as independent',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.TECHNICIAN, Role.FACILITY_MANAGER, Role.ADMIN)
  async unmarkRequestDuplicate(
    @Args('duplicateRequestId', { type: () => ID }) duplicateRequestId: string,
    @CurrentUser() user: User,
  ): Promise<MaintenanceRequest> {
    return this.requestsService.unmarkDuplicate(duplicateRequestId, user);
  }
}
