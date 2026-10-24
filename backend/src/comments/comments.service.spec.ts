import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Role, AccountStatus } from '../common/enums';
import { User } from '../users/models/user.model';

describe('CommentsService', () => {
  let service: CommentsService;
  let prisma: any;
  let audit: Partial<AuditService>;

  const mockRequester: User = {
    id: 'usr-req-1',
    email: 'student@fixflow.edu',
    firstName: 'Riya',
    lastName: 'Sharma',
    name: 'Riya Sharma',
    role: Role.REQUESTER,
    status: AccountStatus.ACTIVE,
    emailVerified: true,
    tokenVersion: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockManager: User = {
    id: 'usr-mgr-1',
    email: 'manager@fixflow.edu',
    firstName: 'Robert',
    lastName: 'Sterling',
    name: 'Robert Sterling',
    role: Role.FACILITY_MANAGER,
    status: AccountStatus.ACTIVE,
    emailVerified: true,
    tokenVersion: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockComment = {
    id: 'c-1',
    requestId: 'req-1',
    authorId: mockRequester.id,
    content: 'Plumber visited and confirmed pipe size.',
    isInternal: false,
    createdAt: new Date(),
    author: mockRequester,
  };

  beforeEach(() => {
    prisma = {
      maintenanceRequest: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'req-1') {
            return Promise.resolve({
              id: 'req-1',
              requestNumber: 'REQ-2026-0001',
              requesterId: mockRequester.id,
            });
          }
          return Promise.resolve(null);
        }),
      },
      comment: {
        findMany: jest.fn().mockResolvedValue([mockComment]),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ ...data, id: 'c-new', author: mockRequester }),
        ),
      },
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'n-1' }),
      },
    };

    audit = {
      logAction: jest.fn().mockResolvedValue({ id: 'aud-1' } as any),
    };

    service = new CommentsService(prisma as PrismaService, audit as AuditService);
  });

  it('should allow requester to post public comment', async () => {
    const result = await service.create(
      { requestId: 'req-1', content: 'Testing comment' },
      mockRequester,
    );

    expect(result).toBeDefined();
    expect(prisma.comment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requestId: 'req-1',
          content: 'Testing comment',
          isInternal: false,
        }),
      }),
    );
  });

  it('should prohibit requesters from creating internal staff notes', async () => {
    await expect(
      service.create(
        { requestId: 'req-1', content: 'Internal note', isInternal: true },
        mockRequester,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should allow facility managers to post internal notes', async () => {
    await service.create(
      { requestId: 'req-1', content: 'Staff only context', isInternal: true },
      mockManager,
    );

    expect(prisma.comment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isInternal: true,
        }),
      }),
    );
  });

  it('should filter out internal comments when queried by a requester', async () => {
    await service.findByRequestId('req-1', mockRequester);

    expect(prisma.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          requestId: 'req-1',
          isInternal: false,
        }),
      }),
    );
  });
});
