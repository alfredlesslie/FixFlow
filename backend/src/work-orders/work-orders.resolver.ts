import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';
import { WorkOrder } from './models/work-order.model';
import { CreateWorkOrderInput } from './dto/create-work-order.input';
import { UpdateWorkOrderStatusInput } from './dto/update-work-order-status.input';
import { CompleteWorkOrderInput } from './dto/complete-work-order.input';
import { VerifyWorkOrderInput } from './dto/verify-work-order.input';
import { HandoverWorkOrderInput } from './dto/handover-work-order.input';
import { WorkOrderFilterInput } from './dto/work-order-filter.input';
import { Role } from '../common/enums';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/models/user.model';

@Resolver(() => WorkOrder)
export class WorkOrdersResolver {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Query(() => [WorkOrder], {
    name: 'workOrders',
    description: 'Retrieve technician work orders with multi-criteria filtering',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.TECHNICIAN, Role.FACILITY_MANAGER, Role.ADMIN)
  async getWorkOrders(
    @Args('filter', { type: () => WorkOrderFilterInput, nullable: true })
    filter?: WorkOrderFilterInput,
    @CurrentUser() user?: User,
  ): Promise<WorkOrder[]> {
    return this.workOrdersService.findAll(filter, user);
  }

  @Query(() => WorkOrder, {
    name: 'workOrder',
    description: 'Retrieve detailed work order execution record by unique ID',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.TECHNICIAN, Role.FACILITY_MANAGER, Role.ADMIN)
  async getWorkOrder(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user?: User,
  ): Promise<WorkOrder> {
    return this.workOrdersService.findById(id, user);
  }

  @Mutation(() => WorkOrder, {
    description: 'Dispatch a maintenance request to an active technician (Facility Manager or Admin only)',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.FACILITY_MANAGER, Role.ADMIN)
  async createWorkOrder(
    @Args('input') input: CreateWorkOrderInput,
    @CurrentUser() user: User,
  ): Promise<WorkOrder> {
    return this.workOrdersService.create(input, user);
  }

  @Mutation(() => WorkOrder, {
    description: 'Technician acceptance of an assigned work order',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.TECHNICIAN, Role.FACILITY_MANAGER, Role.ADMIN)
  async acceptWorkOrder(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<WorkOrder> {
    return this.workOrdersService.accept(id, user);
  }

  @Mutation(() => WorkOrder, {
    description: 'Update operational status and progress notes on an active work order',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.TECHNICIAN, Role.FACILITY_MANAGER, Role.ADMIN)
  async updateWorkOrderStatus(
    @Args('input') input: UpdateWorkOrderStatusInput,
    @CurrentUser() user: User,
  ): Promise<WorkOrder> {
    return this.workOrdersService.updateStatus(input, user);
  }

  @Mutation(() => WorkOrder, {
    description: 'Submit repair completion, consumed parts, and cost accounting',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.TECHNICIAN, Role.FACILITY_MANAGER, Role.ADMIN)
  async completeWorkOrder(
    @Args('input') input: CompleteWorkOrderInput,
    @CurrentUser() user: User,
  ): Promise<WorkOrder> {
    return this.workOrdersService.complete(input, user);
  }

  @Mutation(() => WorkOrder, {
    description: 'Verify and sign-off (or reject with rework) on completed work orders (Facility Manager or Admin only)',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.FACILITY_MANAGER, Role.ADMIN)
  async verifyWorkOrder(
    @Args('input') input: VerifyWorkOrderInput,
    @CurrentUser() user: User,
  ): Promise<WorkOrder> {
    return this.workOrdersService.verify(input, user);
  }

  @Mutation(() => WorkOrder, {
    description: 'Transfer active work order to another certified technician with mandatory shift handover notes',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.TECHNICIAN, Role.FACILITY_MANAGER, Role.ADMIN)
  async handoverWorkOrder(
    @Args('input') input: HandoverWorkOrderInput,
    @CurrentUser() user: User,
  ): Promise<WorkOrder> {
    return this.workOrdersService.handover(input, user);
  }
}
