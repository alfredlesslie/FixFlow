import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Comment } from './models/comment.model';
import { CreateCommentInput } from './dto/create-comment.input';
import { User } from '../users/models/user.model';
import { Role } from '../common/enums';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * List comments for a maintenance request, enforcing staff-only visibility rules for internal notes.
   */
  async findByRequestId(requestId: string, currentUser?: User): Promise<Comment[]> {
    const where: any = { requestId };

    // Ordinary requesters cannot view internal staff notes
    if (currentUser?.role === Role.REQUESTER) {
      where.isInternal = false;
    }

    const comments = await this.prisma.comment.findMany({
      where,
      include: { author: true },
      orderBy: { createdAt: 'asc' },
    });

    return comments as unknown as Comment[];
  }

  /**
   * Post a new comment or technical internal note on a maintenance request.
   */
  async create(input: CreateCommentInput, currentUser: User): Promise<Comment> {
    // 1. Verify target maintenance request exists
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: input.requestId },
    });

    if (!request) {
      throw new NotFoundException(`Maintenance request with ID "${input.requestId}" not found`);
    }

    // 2. Enforce permission: only staff may create internal notes
    let isInternal = input.isInternal ?? false;
    if (isInternal && currentUser.role === Role.REQUESTER) {
      throw new ForbiddenException('Requesters are not permitted to create internal staff notes');
    }

    // 3. Persist comment
    const comment = await this.prisma.comment.create({
      data: {
        requestId: input.requestId,
        authorId: currentUser.id,
        content: input.content.trim(),
        isInternal,
      },
      include: { author: true },
    });

    // 4. Log audit action
    await this.auditService.logAction(
      currentUser.id,
      'COMMENT_CREATED',
      'COMMENT',
      comment.id,
      {
        requestId: request.id,
        requestNumber: request.requestNumber,
        isInternal,
      },
    );

    // 5. Notify request owner if comment is made by another user (and is not an internal note)
    if (!isInternal && request.requesterId !== currentUser.id) {
      try {
        await this.prisma.notification.create({
          data: {
            userId: request.requesterId,
            title: `New Comment on ${request.requestNumber}`,
            message: `${currentUser.firstName} ${currentUser.lastName}: "${input.content.trim().slice(0, 100)}"`,
            type: 'NEW_COMMENT',
            link: `/requester?request=${request.id}`,
            isRead: false,
          },
        });
      } catch {
        // Non-blocking notification creation
      }
    }

    return comment as unknown as Comment;
  }
}
