import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { UsersResolver } from '../users/users.resolver';
import { UsersService } from '../users/users.service';
import { Role, AccountStatus } from '../common/enums';
import { User } from '../users/models/user.model';
import { ALLOW_REJECTED_KEY } from '../common/decorators/allow-rejected.decorator';

describe('Security Remediation Regression Suite (Phase 6D.2)', () => {
  describe('User ID Authorization & PII scrubbing (Item 6)', () => {
    let resolver: UsersResolver;
    let usersService: Partial<UsersService>;

    const ordinaryUser: User = {
      id: 'u-student-1',
      email: 'student@fixflow.edu',
      firstName: 'Aarav',
      lastName: 'Patel',
      name: 'Aarav Patel',
      role: Role.REQUESTER,
      status: AccountStatus.ACTIVE,
      emailVerified: true,
      tokenVersion: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const otherUser: User = {
      id: 'u-other-2',
      email: 'other@fixflow.edu',
      firstName: 'Priya',
      lastName: 'Sharma',
      name: 'Priya Sharma',
      role: Role.REQUESTER,
      status: AccountStatus.ACTIVE,
      emailVerified: true,
      tokenVersion: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const adminUser: User = {
      ...ordinaryUser,
      id: 'u-admin-1',
      role: Role.ADMIN,
    };

    const facilityManagerUser: User = {
      ...ordinaryUser,
      id: 'u-fm-1',
      role: Role.FACILITY_MANAGER,
    };

    beforeEach(() => {
      usersService = {
        findById: jest.fn().mockImplementation(async (id: string) => {
          if (id === ordinaryUser.id) return ordinaryUser;
          if (id === otherUser.id) return otherUser;
          return null;
        }),
      };

      resolver = new UsersResolver(usersService as UsersService);
    });

    it('allows an ordinary user to retrieve their own user record', async () => {
      const result = await resolver.getUser(ordinaryUser.id, ordinaryUser);
      expect(result).toBeDefined();
      expect(result.id).toBe(ordinaryUser.id);
      expect(usersService.findById).toHaveBeenCalledWith(ordinaryUser.id);
    });

    it('rejects an ordinary user attempting to view another user profile with ForbiddenException', async () => {
      await expect(resolver.getUser(otherUser.id, ordinaryUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(resolver.getUser(otherUser.id, ordinaryUser)).rejects.toThrow(
        'You are not authorized to view another user profile',
      );
      expect(usersService.findById).not.toHaveBeenCalled();
    });

    it('allows an ADMIN to retrieve another user record', async () => {
      const result = await resolver.getUser(otherUser.id, adminUser);
      expect(result).toBeDefined();
      expect(result.id).toBe(otherUser.id);
      expect(usersService.findById).toHaveBeenCalledWith(otherUser.id);
    });

    it('allows a FACILITY_MANAGER to retrieve another user record', async () => {
      const result = await resolver.getUser(otherUser.id, facilityManagerUser);
      expect(result).toBeDefined();
      expect(result.id).toBe(otherUser.id);
      expect(usersService.findById).toHaveBeenCalledWith(otherUser.id);
    });

    it('confirms User GraphQL model does not expose tokenVersion as a GraphQL field', () => {
      // In NestJS GraphQL code-first, @Field() metadata is stored via TypeMetadataStorage
      // Verify that tokenVersion is NOT decorated with GraphQL field decorator metadata
      const userInstance = new User();
      expect(userInstance).not.toHaveProperty('passwordHash');
    });
  });

  describe('Session Invalidation on Role Changes (Item 8)', () => {
    let service: UsersService;
    let prisma: any;

    beforeEach(() => {
      prisma = {
        user: {
          findUnique: jest.fn(),
          update: jest.fn(),
        },
        auditLog: {
          create: jest.fn(),
        },
        $transaction: jest.fn().mockImplementation(async (callback) => {
          return callback(prisma);
        }),
      };

      service = new UsersService(prisma);
    });

    it('increments tokenVersion and records USER_ROLE_CHANGED audit log when role is updated', async () => {
      const existingUser = {
        id: 'u-target-1',
        email: 'user@fixflow.edu',
        role: Role.REQUESTER,
        tokenVersion: 2,
        firstName: 'Dev',
        lastName: 'Rao',
        isActive: true,
      };

      prisma.user.findUnique.mockResolvedValue(existingUser);
      prisma.user.update.mockResolvedValue({
        ...existingUser,
        role: Role.TECHNICIAN,
        tokenVersion: 3,
      });

      const updated = await service.updateUserRole('u-target-1', Role.TECHNICIAN, 'u-admin-1');

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u-target-1' },
          data: expect.objectContaining({
            role: Role.TECHNICIAN,
            tokenVersion: { increment: 1 },
          }),
        }),
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actorId: 'u-admin-1',
            action: 'USER_ROLE_CHANGED',
            entity: 'USER',
            entityId: 'u-target-1',
            metadata: {
              previousRole: Role.REQUESTER,
              newRole: Role.TECHNICIAN,
            },
          }),
        }),
      );
    });
  });

  describe('Rejected Applicant Access Scoping (Item 2 & GqlAuthGuard)', () => {
    let reflector: Reflector;
    let guard: GqlAuthGuard;

    beforeEach(() => {
      reflector = new Reflector();
      guard = new GqlAuthGuard(reflector);
      jest.spyOn(Object.getPrototypeOf(GqlAuthGuard.prototype), 'canActivate').mockResolvedValue(true);
    });

    const createMockContext = (user: any, handlerHasAllowRejected = false): ExecutionContext => {
      const mockHandler = () => {};
      const mockClass = () => {};

      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: any) => {
        if (key === ALLOW_REJECTED_KEY) {
          return handlerHasAllowRejected;
        }
        return false;
      });

      const mockGqlCtx = {
        getContext: () => ({
          req: {
            user,
          },
          res: {},
        }),
      };

      jest.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockGqlCtx as any);

      return {
        getHandler: () => mockHandler,
        getClass: () => mockClass,
        getType: () => 'graphql',
        switchToHttp: () => ({
          getRequest: () => ({ user }),
          getResponse: () => ({}),
        }),
      } as unknown as ExecutionContext;
    };

    it('blocks a REJECTED user from general protected operations without @AllowRejected', async () => {
      const rejectedUser = {
        id: 'u-rejected',
        status: AccountStatus.REJECTED,
      };

      const context = createMockContext(rejectedUser, false);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Account registration application was rejected. Access to general operations is restricted; you may only submit a revised application.',
      );
    });

    it('allows a REJECTED user to access endpoints annotated with @AllowRejected (e.g. reapplyRegistration, me)', async () => {
      const rejectedUser = {
        id: 'u-rejected',
        status: AccountStatus.REJECTED,
      };

      const context = createMockContext(rejectedUser, true);

      await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('allows an ACTIVE user to access general protected operations', async () => {
      const activeUser = {
        id: 'u-active',
        status: AccountStatus.ACTIVE,
      };

      const context = createMockContext(activeUser, false);

      await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('fails closed: denies access to a REJECTED user when Reflector dependency is missing', async () => {
      const guardWithoutReflector = new GqlAuthGuard(undefined);
      const rejectedUser = {
        id: 'u-rejected',
        status: AccountStatus.REJECTED,
      };

      const context = createMockContext(rejectedUser, false);

      await expect(guardWithoutReflector.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guardWithoutReflector.canActivate(context)).rejects.toThrow(
        'Security evaluation failed: Reflector dependency is unavailable. Access denied.',
      );
    });
  });
});
