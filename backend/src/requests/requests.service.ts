import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MaintenanceRequest } from './models/maintenance-request.model';
import { CreateRequestInput } from './dto/create-request.input';
import { RequestFilterInput } from './dto/request-filter.input';
import { Priority, RequestStatus, Criticality, AccountStatus, Role } from '../common/enums';
import { User } from '../users/models/user.model';

export const SAFETY_CRITICAL_KEYWORDS = Object.freeze([
  'gas leak',
  'sparking',
  'fire hazard',
  'fire',
  'exposed wire',
  'live wire',
  'smoke',
  'chemical spill',
  'explosion',
  'structural collapse',
  'flooding',
  'electric shock',
]);

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Objective server-side derivation of priority level, SLA target hours, and SLA deadline.
   * Client-provided priorities and SLA values are never trusted.
   */
  derivePriorityAndSLA(
    initialSeverity = 5,
    title: string,
    description: string,
    assetCriticality?: Criticality,
  ): { priority: Priority; slaTargetHours: number; slaDeadline: Date; isSafetyCritical: boolean } {
    const textToScan = `${title} ${description}`.toLowerCase();
    const isSafetyCritical = SAFETY_CRITICAL_KEYWORDS.some((kw) => textToScan.includes(kw));

    // Asset criticality point mapping (0-10)
    let assetScore = 5;
    if (assetCriticality === Criticality.CRITICAL) assetScore = 10;
    else if (assetCriticality === Criticality.HIGH) assetScore = 8;
    else if (assetCriticality === Criticality.MEDIUM) assetScore = 5;
    else if (assetCriticality === Criticality.LOW) assetScore = 2;

    // Severity score component (0-30 max)
    const severityScore = Math.min(30, Math.max(0, (initialSeverity / 10) * 30));
    // Asset criticality score component (0-25 max)
    const criticalityScore = Math.min(25, Math.max(0, (assetScore / 10) * 25));
    const compositeScore = Math.round(severityScore + criticalityScore);

    let priority: Priority;
    let slaTargetHours: number;

    if (isSafetyCritical || initialSeverity >= 9 || compositeScore >= 85) {
      priority = Priority.CRITICAL;
      slaTargetHours = 2; // 2-hour emergency SLA
    } else if (initialSeverity >= 7 || compositeScore >= 65) {
      priority = Priority.HIGH;
      slaTargetHours = 8; // 8-hour same-day SLA
    } else if (initialSeverity >= 4 || compositeScore >= 25) {
      priority = Priority.MEDIUM;
      slaTargetHours = 24; // 24-hour standard SLA
    } else {
      priority = Priority.LOW;
      slaTargetHours = 72; // 72-hour routine SLA
    }

    const slaDeadline = new Date(Date.now() + slaTargetHours * 60 * 60 * 1000);

    return { priority, slaTargetHours, slaDeadline, isSafetyCritical };
  }

  /**
   * Generate an institutional request number in the sequence format REQ-YYYY-XXXX.
   */
  async generateRequestNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear + 1, 0, 1);

    const yearCount = await this.prisma.maintenanceRequest.count({
      where: {
        createdAt: {
          gte: startOfYear,
          lt: endOfYear,
        },
      },
    });

    let sequence = yearCount + 1;
    let candidate = `REQ-${currentYear}-${String(sequence).padStart(4, '0')}`;

    // Collision fallback
    let existing = await this.prisma.maintenanceRequest.findUnique({
      where: { requestNumber: candidate },
    });
    while (existing) {
      sequence++;
      candidate = `REQ-${currentYear}-${String(sequence).padStart(4, '0')}`;
      existing = await this.prisma.maintenanceRequest.findUnique({
        where: { requestNumber: candidate },
      });
    }

    return candidate;
  }

  /**
   * Retrieve count of occupant/community upvotes for a request using authoritative RequestVote model.
   */
  async getUpvotesCount(requestId: string): Promise<number> {
    return this.prisma.requestVote.count({
      where: { requestId },
    });
  }

  /**
   * Determine if a user has upvoted a maintenance request via RequestVote unique constraint.
   */
  async hasUserUpvoted(requestId: string, userId: string): Promise<boolean> {
    const vote = await this.prisma.requestVote.findUnique({
      where: {
        requestId_userId: { requestId, userId },
      },
    });
    return !!vote;
  }

  /**
   * Retrieve persisted maintenance requests with multi-criteria filtering, text search,
   * relational upvotes, and duplicate status.
   */
  async findAll(filter?: RequestFilterInput, currentUser?: User): Promise<MaintenanceRequest[]> {
    const where: any = {};

    if (filter?.search) {
      const q = filter.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { requestNumber: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.priority) {
      where.priority = filter.priority;
    }

    if (filter?.locationId) {
      where.locationId = filter.locationId;
    }

    if (filter?.assetId) {
      where.assetId = filter.assetId;
    }

    if (filter?.categoryId) {
      where.asset = {
        categoryId: filter.categoryId,
      };
    }

    if (filter?.myReportsOnly && currentUser) {
      where.requesterId = currentUser.id;
    } else if (filter?.requesterId) {
      where.requesterId = filter.requesterId;
    }

    const requests = await this.prisma.maintenanceRequest.findMany({
      where,
      include: {
        requester: true,
        location: true,
        asset: {
          include: {
            category: true,
            location: true,
          },
        },
        duplicateLinkAsDuplicate: {
          include: {
            originalRequest: { select: { id: true, requestNumber: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (requests.length === 0) {
      return [];
    }

    // Efficient batch retrieval of authoritative upvotes without N+1 query penalty
    const requestIds = requests.map((r) => r.id);
    const votes = await this.prisma.requestVote.findMany({
      where: {
        requestId: { in: requestIds },
      },
      select: { requestId: true, userId: true },
    });

    const upvoteCounts = new Map<string, number>();
    const userVotedSet = new Set<string>();

    for (const v of votes) {
      upvoteCounts.set(v.requestId, (upvoteCounts.get(v.requestId) || 0) + 1);
      if (currentUser && v.userId === currentUser.id) {
        userVotedSet.add(v.requestId);
      }
    }

    return requests.map((req) => ({
      ...req,
      upvotesCount: upvoteCounts.get(req.id) || 0,
      hasUpvoted: currentUser ? userVotedSet.has(req.id) : false,
      isDuplicate: !!req.duplicateLinkAsDuplicate,
      duplicateOfId: req.duplicateLinkAsDuplicate?.originalRequestId || null,
      duplicateOfNumber: req.duplicateLinkAsDuplicate?.originalRequest?.requestNumber || null,
      duplicateReason: req.duplicateLinkAsDuplicate?.reason || null,
    })) as unknown as MaintenanceRequest[];
  }

  /**
   * Retrieve complete maintenance request details by unique ID with authoritative
   * relational upvotes and duplicate associations.
   */
  async findById(id: string, currentUser?: User): Promise<MaintenanceRequest> {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        requester: true,
        location: true,
        asset: {
          include: {
            category: true,
            location: true,
          },
        },
        duplicateLinkAsDuplicate: {
          include: {
            originalRequest: { select: { id: true, requestNumber: true } },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException(`Maintenance request with ID ${id} not found`);
    }

    const upvotesCount = await this.prisma.requestVote.count({
      where: { requestId: id },
    });

    const hasUpvoted = currentUser
      ? !!(await this.prisma.requestVote.findUnique({
          where: { requestId_userId: { requestId: id, userId: currentUser.id } },
        }))
      : false;

    return {
      ...request,
      upvotesCount,
      hasUpvoted,
      isDuplicate: !!request.duplicateLinkAsDuplicate,
      duplicateOfId: request.duplicateLinkAsDuplicate?.originalRequestId || null,
      duplicateOfNumber: request.duplicateLinkAsDuplicate?.originalRequest?.requestNumber || null,
      duplicateReason: request.duplicateLinkAsDuplicate?.reason || null,
    } as unknown as MaintenanceRequest;
  }

  /**
   * Create and persist a new campus maintenance request with validated relations,
   * server-derived priority and SLA, and audit record creation.
   */
  async create(input: CreateRequestInput, currentUser: User): Promise<MaintenanceRequest> {
    // 1. Enforce active account lifecycle verification
    if (currentUser.status !== AccountStatus.ACTIVE) {
      throw new ForbiddenException(
        `Account status (${currentUser.status}) is not authorized to submit maintenance requests.`,
      );
    }

    // 2. Validate physical campus location existence
    const location = await this.prisma.location.findUnique({
      where: { id: input.locationId },
    });
    if (!location) {
      throw new NotFoundException(`Location with ID "${input.locationId}" not found`);
    }

    // 3. Validate optional affected asset existence
    let asset: any = null;
    if (input.assetId) {
      asset = await this.prisma.asset.findUnique({
        where: { id: input.assetId },
        include: { category: true, location: true },
      });
      if (!asset) {
        throw new NotFoundException(`Asset with ID "${input.assetId}" not found`);
      }
    }

    // 4. Server-side priority and SLA computation
    const { priority, slaTargetHours, slaDeadline, isSafetyCritical } = this.derivePriorityAndSLA(
      input.initialSeverity ?? 5,
      input.title,
      input.description,
      asset?.criticality,
    );

    // 5. Generate collision-resistant request number
    const requestNumber = await this.generateRequestNumber();

    // 6. Persist maintenance request
    const createdRequest = await this.prisma.maintenanceRequest.create({
      data: {
        requestNumber,
        title: input.title.trim(),
        description: input.description.trim(),
        requesterId: currentUser.id,
        locationId: input.locationId,
        assetId: input.assetId || null,
        priority,
        status: RequestStatus.OPEN,
        slaTargetHours,
        slaDeadline,
        slaBreached: false,
      },
      include: {
        requester: true,
        location: true,
        asset: {
          include: {
            category: true,
            location: true,
          },
        },
      },
    });

    // 7. Record institutional audit event
    await this.auditService.logAction(
      currentUser.id,
      'REQUEST_CREATED',
      'MAINTENANCE_REQUEST',
      createdRequest.id,
      {
        requestNumber: createdRequest.requestNumber,
        title: createdRequest.title,
        priority: createdRequest.priority,
        isSafetyCritical,
        locationId: createdRequest.locationId,
        assetId: createdRequest.assetId,
        slaTargetHours: createdRequest.slaTargetHours,
        slaDeadline: createdRequest.slaDeadline.toISOString(),
      },
    );

    return {
      ...createdRequest,
      upvotesCount: 0,
      hasUpvoted: false,
    } as unknown as MaintenanceRequest;
  }

  /**
   * Upvote a maintenance request to signal community impact.
   * Authoritative votes are stored in dedicated RequestVote table with database-level uniqueness.
   */
  async upvote(id: string, currentUser: User): Promise<MaintenanceRequest> {
    if (currentUser.status !== AccountStatus.ACTIVE) {
      throw new ForbiddenException(
        `Account status (${currentUser.status}) is not authorized to upvote requests.`,
      );
    }

    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException(`Maintenance request with ID "${id}" not found`);
    }

    try {
      await this.prisma.requestVote.create({
        data: {
          requestId: id,
          userId: currentUser.id,
        },
      });
    } catch (err: any) {
      if (err.code === 'P2002' || err.message?.includes('Unique constraint')) {
        throw new ConflictException('You have already upvoted this maintenance request');
      }
      throw err;
    }

    // Keep institutional audit log separate from authoritative relational state
    await this.auditService.logAction(
      currentUser.id,
      'REQUEST_UPVOTED',
      'MAINTENANCE_REQUEST',
      id,
      {
        requestNumber: request.requestNumber,
        voterId: currentUser.id,
        timestamp: new Date().toISOString(),
      },
    );

    return this.findById(id, currentUser);
  }

  /**
   * Remove an existing upvote from a maintenance request.
   */
  async removeUpvote(id: string, currentUser: User): Promise<MaintenanceRequest> {
    const existing = await this.prisma.requestVote.findUnique({
      where: {
        requestId_userId: {
          requestId: id,
          userId: currentUser.id,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('You have not upvoted this maintenance request');
    }

    await this.prisma.requestVote.delete({
      where: {
        requestId_userId: {
          requestId: id,
          userId: currentUser.id,
        },
      },
    });

    await this.auditService.logAction(
      currentUser.id,
      'REQUEST_UPVOTE_REMOVED',
      'MAINTENANCE_REQUEST',
      id,
      {
        voterId: currentUser.id,
        timestamp: new Date().toISOString(),
      },
    );

    return this.findById(id, currentUser);
  }

  /**
   * Explicitly link a duplicate maintenance request to its authoritative canonical request.
   * Strictly enforces cycle prevention and self-reference prevention.
   */
  async markDuplicate(
    duplicateRequestId: string,
    originalRequestId: string,
    reason: string,
    currentUser: User,
  ): Promise<MaintenanceRequest> {
    if (
      currentUser.role !== Role.FACILITY_MANAGER &&
      currentUser.role !== Role.ADMIN &&
      currentUser.role !== Role.TECHNICIAN
    ) {
      throw new ForbiddenException('Only maintenance staff, managers, or administrators can mark duplicate requests.');
    }

    if (duplicateRequestId === originalRequestId) {
      throw new BadRequestException('A maintenance request cannot be marked as a duplicate of itself.');
    }

    const [dupReq, origReq] = await Promise.all([
      this.prisma.maintenanceRequest.findUnique({ where: { id: duplicateRequestId } }),
      this.prisma.maintenanceRequest.findUnique({ where: { id: originalRequestId } }),
    ]);

    if (!dupReq) {
      throw new NotFoundException(`Duplicate request with ID "${duplicateRequestId}" not found.`);
    }
    if (!origReq) {
      throw new NotFoundException(`Original request with ID "${originalRequestId}" not found.`);
    }

    if (dupReq.priority === Priority.CRITICAL && (!reason || reason.trim().length < 10)) {
      throw new BadRequestException(
        'Critical priority requests require an explicit justification (minimum 10 characters) before being marked as duplicate.',
      );
    }

    // Cycle prevention: verify traversing up originalRequestId does not reach duplicateRequestId
    let cursor: string | null = originalRequestId;
    const visited = new Set<string>([duplicateRequestId]);

    while (cursor) {
      if (visited.has(cursor)) {
        throw new BadRequestException('Circular duplicate relationship detected: linking would create a loop.');
      }
      visited.add(cursor);
      const parentLink = await this.prisma.requestDuplicate.findUnique({
        where: { duplicateRequestId: cursor },
      });
      cursor = parentLink ? parentLink.originalRequestId : null;
    }

    await this.prisma.requestDuplicate.upsert({
      where: { duplicateRequestId },
      create: {
        originalRequestId,
        duplicateRequestId,
        markedById: currentUser.id,
        reason: reason?.trim() || 'Identified as duplicate of active request',
      },
      update: {
        originalRequestId,
        markedById: currentUser.id,
        reason: reason?.trim() || 'Updated duplicate reference',
      },
    });

    await this.auditService.logAction(
      currentUser.id,
      'REQUEST_MARKED_DUPLICATE',
      'MAINTENANCE_REQUEST',
      duplicateRequestId,
      {
        duplicateNumber: dupReq.requestNumber,
        originalRequestId,
        originalNumber: origReq.requestNumber,
        markedBy: currentUser.id,
        reason: reason?.trim(),
      },
    );

    return this.findById(duplicateRequestId, currentUser);
  }

  /**
   * Unlink a duplicate maintenance request, restoring it to an independent request.
   */
  async unmarkDuplicate(duplicateRequestId: string, currentUser: User): Promise<MaintenanceRequest> {
    if (
      currentUser.role !== Role.FACILITY_MANAGER &&
      currentUser.role !== Role.ADMIN &&
      currentUser.role !== Role.TECHNICIAN
    ) {
      throw new ForbiddenException('Only maintenance staff, managers, or administrators can unmark duplicate requests.');
    }

    const existingLink = await this.prisma.requestDuplicate.findUnique({
      where: { duplicateRequestId },
    });

    if (!existingLink) {
      throw new NotFoundException(`Request with ID "${duplicateRequestId}" is not marked as a duplicate.`);
    }

    await this.prisma.requestDuplicate.delete({
      where: { duplicateRequestId },
    });

    await this.auditService.logAction(
      currentUser.id,
      'REQUEST_DUPLICATE_UNLINKED',
      'MAINTENANCE_REQUEST',
      duplicateRequestId,
      {
        previousOriginalId: existingLink.originalRequestId,
        unmarkedBy: currentUser.id,
      },
    );

    return this.findById(duplicateRequestId, currentUser);
  }

  /**
   * Search for duplicate candidates among active requests based on title keywords and optional location.
   */
  async suggestDuplicates(title: string, locationId?: string): Promise<MaintenanceRequest[]> {
    if (!title || title.trim().length < 4) {
      return [];
    }

    const words = title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !['with', 'from', 'that', 'this', 'have', 'there'].includes(w));

    const orConditions: any[] = [];
    for (const w of words.slice(0, 4)) {
      orConditions.push({ title: { contains: w, mode: 'insensitive' } });
      orConditions.push({ description: { contains: w, mode: 'insensitive' } });
    }

    const where: any = {
      status: {
        in: [
          RequestStatus.OPEN,
          RequestStatus.TRIAGED,
          RequestStatus.ASSIGNED,
          RequestStatus.IN_PROGRESS,
          RequestStatus.REOPENED,
        ],
      },
    };

    if (locationId) {
      where.locationId = locationId;
    }

    if (orConditions.length > 0) {
      where.OR = orConditions;
    }

    const candidates = await this.prisma.maintenanceRequest.findMany({
      where,
      take: 5,
      include: {
        requester: true,
        location: true,
        asset: {
          include: { category: true, location: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return candidates as unknown as MaintenanceRequest[];
  }

  /**
   * Manually override priority with manager justification and institutional audit logging.
   */
  async overridePriority(
    id: string,
    priority: Priority,
    reason: string,
    currentUser: User,
  ): Promise<MaintenanceRequest> {
    const existing = await this.prisma.maintenanceRequest.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Maintenance request with ID "${id}" not found`);
    }

    // SLA hours adjustment for overridden priority
    let slaTargetHours = 24;
    if (priority === Priority.CRITICAL) slaTargetHours = 2;
    else if (priority === Priority.HIGH) slaTargetHours = 8;
    else if (priority === Priority.MEDIUM) slaTargetHours = 24;
    else if (priority === Priority.LOW) slaTargetHours = 72;

    const slaDeadline = new Date(Date.now() + slaTargetHours * 60 * 60 * 1000);

    const updated = await this.prisma.maintenanceRequest.update({
      where: { id },
      data: {
        priority,
        slaTargetHours,
        slaDeadline,
      },
      include: {
        requester: true,
        location: true,
        asset: {
          include: { category: true, location: true },
        },
      },
    });

    await this.auditService.logAction(
      currentUser.id,
      'PRIORITY_OVERRIDDEN',
      'MAINTENANCE_REQUEST',
      id,
      {
        previousPriority: existing.priority,
        newPriority: priority,
        reason: reason.trim(),
        overriddenBy: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
      },
    );

    return this.findById(id, currentUser);
  }

  /**
   * Reopen a resolved or closed maintenance request.
   */
  async reopenRequest(id: string, reason: string, currentUser: User): Promise<MaintenanceRequest> {
    const request = await this.prisma.maintenanceRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Maintenance request with ID "${id}" not found`);
    }

    // Only creator or staff can reopen
    if (
      request.requesterId !== currentUser.id &&
      currentUser.role !== Role.FACILITY_MANAGER &&
      currentUser.role !== Role.ADMIN
    ) {
      throw new ForbiddenException('You are not authorized to reopen this maintenance request');
    }

    const updated = await this.prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status: RequestStatus.REOPENED,
      },
      include: {
        requester: true,
        location: true,
        asset: {
          include: { category: true, location: true },
        },
      },
    });

    await this.auditService.logAction(
      currentUser.id,
      'REQUEST_REOPENED',
      'MAINTENANCE_REQUEST',
      id,
      {
        reason: reason.trim(),
        reopenedBy: currentUser.id,
      },
    );

    return this.findById(id, currentUser);
  }
}
