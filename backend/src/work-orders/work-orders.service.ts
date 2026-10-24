import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { WorkOrder } from './models/work-order.model';
import { CreateWorkOrderInput } from './dto/create-work-order.input';
import { UpdateWorkOrderStatusInput } from './dto/update-work-order-status.input';
import { CompleteWorkOrderInput } from './dto/complete-work-order.input';
import { VerifyWorkOrderInput } from './dto/verify-work-order.input';
import { HandoverWorkOrderInput } from './dto/handover-work-order.input';
import { WorkOrderFilterInput } from './dto/work-order-filter.input';
import {
  WorkOrderStatus,
  RequestStatus,
  Role,
  AccountStatus,
} from '../common/enums';
import { User } from '../users/models/user.model';

@Injectable()
export class WorkOrdersService {
  private readonly logger = new Logger(WorkOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Generates a collision-resistant work order sequence number in the format WO-YYYY-XXXX.
   */
  async generateOrderNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear + 1, 0, 1);

    const yearCount = await this.prisma.workOrder.count({
      where: {
        createdAt: {
          gte: startOfYear,
          lt: endOfYear,
        },
      },
    });

    let sequence = yearCount + 1;
    let candidate = `WO-${currentYear}-${String(sequence).padStart(4, '0')}`;

    let existing = await this.prisma.workOrder.findUnique({
      where: { orderNumber: candidate },
    });
    while (existing) {
      sequence++;
      candidate = `WO-${currentYear}-${String(sequence).padStart(4, '0')}`;
      existing = await this.prisma.workOrder.findUnique({
        where: { orderNumber: candidate },
      });
    }

    return candidate;
  }

  /**
   * Helper to create in-app notification records safely.
   */
  private async createNotificationSafe(
    userId: string,
    title: string,
    message: string,
    type: string,
    link?: string,
  ) {
    try {
      await this.prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          link,
          isRead: false,
        },
      });
    } catch (err: any) {
      this.logger.warn(`Failed to create notification for user ${userId}: ${err.message}`);
    }
  }

  /**
   * Retrieve work orders with multi-criteria filtering and role-based scoping.
   */
  async findAll(filter?: WorkOrderFilterInput, currentUser?: User): Promise<WorkOrder[]> {
    const where: any = {};

    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.requestId) {
      where.requestId = filter.requestId;
    }

    if (filter?.myWorkOnly && currentUser) {
      where.technicianId = currentUser.id;
    } else if (filter?.technicianId) {
      where.technicianId = filter.technicianId;
    } else if (currentUser?.role === Role.TECHNICIAN) {
      // Technicians default to their own queue unless explicitly specified
      where.technicianId = currentUser.id;
    }

    const orders = await this.prisma.workOrder.findMany({
      where,
      include: {
        request: {
          include: {
            requester: true,
            location: true,
            asset: { include: { category: true, location: true } },
          },
        },
        asset: { include: { category: true, location: true } },
        technician: true,
        handovers: {
          include: { previousTech: true, nextTech: true },
          orderBy: { createdAt: 'desc' },
        },
        records: {
          include: { technician: true },
          orderBy: { dateCompleted: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders as unknown as WorkOrder[];
  }

  /**
   * Retrieve complete work order details by unique ID.
   */
  async findById(id: string, currentUser?: User): Promise<WorkOrder> {
    const order = await this.prisma.workOrder.findUnique({
      where: { id },
      include: {
        request: {
          include: {
            requester: true,
            location: true,
            asset: { include: { category: true, location: true } },
          },
        },
        asset: { include: { category: true, location: true } },
        technician: true,
        handovers: {
          include: { previousTech: true, nextTech: true },
          orderBy: { createdAt: 'desc' },
        },
        records: {
          include: { technician: true },
          orderBy: { dateCompleted: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Work order with ID "${id}" not found`);
    }

    // Role check: technicians can only access work orders assigned to them or unassigned
    if (
      currentUser?.role === Role.TECHNICIAN &&
      order.technicianId &&
      order.technicianId !== currentUser.id
    ) {
      throw new ForbiddenException('You are not authorized to view work orders assigned to other technicians');
    }

    return order as unknown as WorkOrder;
  }

  /**
   * Dispatch a new work order for a maintenance request to an active certified technician.
   */
  async create(input: CreateWorkOrderInput, managerUser: User): Promise<WorkOrder> {
    // 1. Validate target maintenance request
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: input.requestId },
      include: { workOrder: true },
    });

    if (!request) {
      throw new NotFoundException(`Maintenance request with ID "${input.requestId}" not found`);
    }

    if (request.workOrder) {
      throw new ConflictException(
        `Maintenance request "${request.requestNumber}" is already linked to work order "${request.workOrder.orderNumber}"`,
      );
    }

    // 2. Validate technician eligibility
    const technician = await this.prisma.user.findUnique({
      where: { id: input.technicianId },
    });

    if (!technician) {
      throw new NotFoundException(`Technician with ID "${input.technicianId}" not found`);
    }

    if (technician.role !== Role.TECHNICIAN) {
      throw new BadRequestException(`User "${technician.email}" does not hold the TECHNICIAN role`);
    }

    if (technician.status !== AccountStatus.ACTIVE) {
      throw new ForbiddenException(`Technician account is not in ACTIVE status (current: ${technician.status})`);
    }

    // 3. Generate unique order number
    const orderNumber = await this.generateOrderNumber();

    // 4. Atomic transaction: create work order & transition request status to ASSIGNED
    const createdOrder = await this.prisma.$transaction(async (tx) => {
      const order = await tx.workOrder.create({
        data: {
          orderNumber,
          requestId: input.requestId,
          assetId: request.assetId || null,
          technicianId: input.technicianId,
          status: WorkOrderStatus.PENDING,
          instructions: input.instructions?.trim() || null,
          estimatedCost: input.estimatedCost || null,
        },
      });

      await tx.maintenanceRequest.update({
        where: { id: input.requestId },
        data: {
          status: RequestStatus.ASSIGNED,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: managerUser.id,
          action: 'WORK_ORDER_DISPATCHED',
          entity: 'WORK_ORDER',
          entityId: order.id,
          metadata: {
            orderNumber: order.orderNumber,
            requestId: request.id,
            requestNumber: request.requestNumber,
            technicianId: technician.id,
            technicianName: `${technician.firstName} ${technician.lastName}`.trim(),
            estimatedCost: input.estimatedCost,
          },
        },
      });

      return order;
    });

    // Notify technician
    await this.createNotificationSafe(
      technician.id,
      'New Work Order Assigned',
      `You have been assigned to work order ${orderNumber} for "${request.title}".`,
      'WORK_ORDER_ASSIGNED',
      `/technician?order=${createdOrder.id}`,
    );

    return this.findById(createdOrder.id, managerUser);
  }

  /**
   * Accept an assigned work order (technician confirms assignment).
   */
  async accept(id: string, currentUser: User): Promise<WorkOrder> {
    const order = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Work order with ID "${id}" not found`);
    }

    if (
      currentUser.role === Role.TECHNICIAN &&
      order.technicianId !== currentUser.id
    ) {
      throw new ForbiddenException('You can only accept work orders assigned to you');
    }

    if (order.status !== WorkOrderStatus.PENDING) {
      throw new BadRequestException(`Cannot accept work order in status "${order.status}" (must be PENDING)`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.workOrder.update({
        where: { id },
        data: {
          status: WorkOrderStatus.ACCEPTED,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: currentUser.id,
          action: 'WORK_ORDER_ACCEPTED',
          entity: 'WORK_ORDER',
          entityId: id,
          metadata: {
            orderNumber: order.orderNumber,
            acceptedBy: currentUser.id,
          },
        },
      });
    });

    return this.findById(id, currentUser);
  }

  /**
   * Update work status (e.g. commencement of physical work or placing on hold).
   */
  async updateStatus(input: UpdateWorkOrderStatusInput, currentUser: User): Promise<WorkOrder> {
    const order = await this.prisma.workOrder.findUnique({
      where: { id: input.id },
      include: { request: true },
    });

    if (!order) {
      throw new NotFoundException(`Work order with ID "${input.id}" not found`);
    }

    if (
      currentUser.role === Role.TECHNICIAN &&
      order.technicianId !== currentUser.id
    ) {
      throw new ForbiddenException('You can only update work orders assigned to you');
    }

    const data: any = {
      status: input.status,
    };

    if (input.workNotes) {
      data.workNotes = input.workNotes.trim();
    }

    if (input.status === WorkOrderStatus.IN_PROGRESS && !order.startedAt) {
      data.startedAt = new Date();
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.workOrder.update({
        where: { id: input.id },
        data,
      });

      // Synchronize request lifecycle state with technician progress
      if (input.status === WorkOrderStatus.IN_PROGRESS) {
        await tx.maintenanceRequest.update({
          where: { id: order.requestId },
          data: { status: RequestStatus.IN_PROGRESS },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: currentUser.id,
          action: 'WORK_ORDER_STATUS_CHANGED',
          entity: 'WORK_ORDER',
          entityId: order.id,
          metadata: {
            orderNumber: order.orderNumber,
            previousStatus: order.status,
            newStatus: input.status,
            workNotes: input.workNotes,
          },
        },
      });
    });

    return this.findById(input.id, currentUser);
  }

  /**
   * Complete physical work order, submit repair notes and parts, and log a permanent maintenance record.
   */
  async complete(input: CompleteWorkOrderInput, currentUser: User): Promise<WorkOrder> {
    const order = await this.prisma.workOrder.findUnique({
      where: { id: input.id },
      include: { request: true },
    });

    if (!order) {
      throw new NotFoundException(`Work order with ID "${input.id}" not found`);
    }

    if (
      currentUser.role === Role.TECHNICIAN &&
      order.technicianId !== currentUser.id
    ) {
      throw new ForbiddenException('You can only complete work orders assigned to you');
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      // 1. Update work order completion fields
      await tx.workOrder.update({
        where: { id: input.id },
        data: {
          status: WorkOrderStatus.COMPLETED,
          completedAt: now,
          resolutionSummary: input.resolutionSummary.trim(),
          partsUsed: input.partsUsed?.trim() || null,
          actualCost: input.actualCost || null,
          workNotes: input.workNotes?.trim() || order.workNotes,
        },
      });

      // 2. Transition request to RESOLVED state
      await tx.maintenanceRequest.update({
        where: { id: order.requestId },
        data: {
          status: RequestStatus.RESOLVED,
          resolvedAt: now,
        },
      });

      // 3. Create permanent MaintenanceRecord if asset is linked
      if (order.assetId) {
        await tx.maintenanceRecord.create({
          data: {
            assetId: order.assetId,
            workOrderId: order.id,
            technicianId: currentUser.id,
            actionTaken: input.resolutionSummary.trim(),
            repairDetails: input.repairDetails?.trim() || null,
            partsReplaced: input.partsUsed?.trim() || null,
            cost: input.actualCost || null,
            dateCompleted: now,
          },
        });
      }

      // 4. Create immutable audit event
      await tx.auditLog.create({
        data: {
          actorId: currentUser.id,
          action: 'WORK_ORDER_COMPLETED',
          entity: 'WORK_ORDER',
          entityId: order.id,
          metadata: {
            orderNumber: order.orderNumber,
            resolutionSummary: input.resolutionSummary,
            actualCost: input.actualCost,
            partsUsed: input.partsUsed,
          },
        },
      });
    });

    // Notify requester of resolution
    if (order.request?.requesterId) {
      await this.createNotificationSafe(
        order.request.requesterId,
        'Maintenance Request Resolved',
        `Your maintenance request "${order.request.title}" has been resolved and is pending verification.`,
        'REQUEST_RESOLVED',
        `/requester?request=${order.requestId}`,
      );
    }

    return this.findById(input.id, currentUser);
  }

  /**
   * Facility Manager verification and formal sign-off (or rejection with rework instructions).
   */
  async verify(input: VerifyWorkOrderInput, managerUser: User): Promise<WorkOrder> {
    const order = await this.prisma.workOrder.findUnique({
      where: { id: input.id },
      include: { request: true },
    });

    if (!order) {
      throw new NotFoundException(`Work order with ID "${input.id}" not found`);
    }

    if (order.status !== WorkOrderStatus.COMPLETED) {
      throw new BadRequestException(
        `Cannot verify work order in "${order.status}" status (must be COMPLETED)`,
      );
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      if (input.approved) {
        // Sign-off: verify and close request
        await tx.maintenanceRequest.update({
          where: { id: order.requestId },
          data: {
            status: RequestStatus.CLOSED,
            verificationNotes: input.notes?.trim() || 'Verified satisfactory by facility manager.',
            closedAt: now,
          },
        });

        await tx.auditLog.create({
          data: {
            actorId: managerUser.id,
            action: 'WORK_ORDER_VERIFIED',
            entity: 'WORK_ORDER',
            entityId: order.id,
            metadata: {
              orderNumber: order.orderNumber,
              verifiedBy: managerUser.id,
              notes: input.notes,
            },
          },
        });
      } else {
        // Rejection / Rework required: return request to IN_PROGRESS
        await tx.maintenanceRequest.update({
          where: { id: order.requestId },
          data: {
            status: RequestStatus.IN_PROGRESS,
            verificationNotes: `Rework Required: ${input.notes?.trim() || 'No notes provided.'}`,
          },
        });

        await tx.workOrder.update({
          where: { id: order.id },
          data: {
            status: WorkOrderStatus.IN_PROGRESS,
            workNotes: `Verification Rejected by Manager: ${input.notes?.trim() || ''}`,
          },
        });

        await tx.auditLog.create({
          data: {
            actorId: managerUser.id,
            action: 'WORK_ORDER_VERIFICATION_REJECTED',
            entity: 'WORK_ORDER',
            entityId: order.id,
            metadata: {
              orderNumber: order.orderNumber,
              rejectedBy: managerUser.id,
              rejectionNotes: input.notes,
            },
          },
        });
      }
    });

    if (input.approved) {
      if (order.request?.requesterId) {
        await this.createNotificationSafe(
          order.request.requesterId,
          'Maintenance Request Verified & Closed',
          `Your maintenance request "${order.request.title}" has been inspected, verified satisfactory, and closed by facility management.`,
          'REQUEST_CLOSED',
          `/requester?request=${order.requestId}`,
        );
      }
      if (order.technicianId) {
        await this.createNotificationSafe(
          order.technicianId,
          'Work Order Verified',
          `Work order "${order.orderNumber}" for "${order.request?.title || 'request'}" was verified and approved by the facility manager.`,
          'WORK_ORDER_VERIFIED',
          `/technician?order=${order.id}`,
        );
      }
    } else {
      if (order.technicianId) {
        await this.createNotificationSafe(
          order.technicianId,
          'Work Order Returned for Rework',
          `Work order "${order.orderNumber}" requires rework: ${input.notes?.trim() || 'Inspection not passed.'}`,
          'WORK_ORDER_REJECTED',
          `/technician?order=${order.id}`,
        );
      }
      if (order.request?.requesterId) {
        await this.createNotificationSafe(
          order.request.requesterId,
          'Maintenance In Progress (Rework Ordered)',
          `The facility manager reviewed work on "${order.request.title}" and ordered additional adjustments before sign-off.`,
          'REQUEST_IN_PROGRESS',
          `/requester?request=${order.requestId}`,
        );
      }
    }

    return this.findById(input.id, managerUser);
  }

  /**
   * Transfer active work order responsibility to another technician with documented handover notes.
   */
  async handover(input: HandoverWorkOrderInput, currentUser: User): Promise<WorkOrder> {
    const order = await this.prisma.workOrder.findUnique({
      where: { id: input.workOrderId },
    });

    if (!order) {
      throw new NotFoundException(`Work order with ID "${input.workOrderId}" not found`);
    }

    // Only assigned tech or manager/admin can initiate handover
    if (
      currentUser.role === Role.TECHNICIAN &&
      order.technicianId !== currentUser.id
    ) {
      throw new ForbiddenException('You can only hand over work orders assigned to you');
    }

    if (
      order.status !== WorkOrderStatus.ACCEPTED &&
      order.status !== WorkOrderStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        `Handover is only permissible for active work orders in ACCEPTED or IN_PROGRESS state (current: ${order.status})`,
      );
    }

    // Validate next technician
    const nextTech = await this.prisma.user.findUnique({
      where: { id: input.nextTechId },
    });

    if (!nextTech) {
      throw new NotFoundException(`Next technician with ID "${input.nextTechId}" not found`);
    }

    if (nextTech.role !== Role.TECHNICIAN) {
      throw new BadRequestException(`User "${nextTech.email}" is not a technician`);
    }

    if (nextTech.status !== AccountStatus.ACTIVE) {
      throw new ForbiddenException(`Next technician account is not active`);
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Create permanent handover record
      await tx.workOrderHandover.create({
        data: {
          workOrderId: order.id,
          previousTechId: order.technicianId,
          nextTechId: input.nextTechId,
          handoverNotes: input.handoverNotes.trim(),
          reason: input.reason?.trim() || null,
        },
      });

      // 2. Reassign work order to incoming technician
      await tx.workOrder.update({
        where: { id: order.id },
        data: {
          technicianId: input.nextTechId,
          workNotes: `[HANDOVER from ${currentUser.firstName} ${currentUser.lastName}]: ${input.handoverNotes.trim()}`,
        },
      });

      // 3. Record audit event
      await tx.auditLog.create({
        data: {
          actorId: currentUser.id,
          action: 'WORK_ORDER_HANDOVER',
          entity: 'WORK_ORDER',
          entityId: order.id,
          metadata: {
            orderNumber: order.orderNumber,
            fromTechId: order.technicianId,
            toTechId: input.nextTechId,
            notes: input.handoverNotes,
            reason: input.reason,
          },
        },
      });
    });

    // Notify incoming technician
    await this.createNotificationSafe(
      nextTech.id,
      'Work Order Handed Over to You',
      `Work order ${order.orderNumber} has been transferred to you. Notes: "${input.handoverNotes.trim()}".`,
      'WORK_ORDER_HANDOVER',
      `/technician?order=${order.id}`,
    );

    return this.findById(input.workOrderId, currentUser);
  }
}
