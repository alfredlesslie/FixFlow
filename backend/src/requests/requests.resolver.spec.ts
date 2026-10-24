import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RequestsResolver } from './requests.resolver';
import { RequestsService } from './requests.service';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role, Priority } from '../common/enums';
import { ROLES_KEY } from '../common/decorators/roles.decorator';

describe('RequestsResolver & Authorization Guards', () => {
  let resolver: RequestsResolver;
  let requestsService: Partial<RequestsService>;

  beforeEach(() => {
    requestsService = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue({ id: 'req-1' } as any),
      create: jest.fn().mockResolvedValue({ id: 'req-1' } as any),
      upvote: jest.fn().mockResolvedValue({ id: 'req-1' } as any),
    };

    resolver = new RequestsResolver(requestsService as RequestsService);
  });

  describe('Guard Annotations', () => {
    it('should have GqlAuthGuard applied to queries', () => {
      const getRequestsGuards = Reflect.getMetadata('__guards__', RequestsResolver.prototype.getRequests);
      const getRequestGuards = Reflect.getMetadata('__guards__', RequestsResolver.prototype.getRequest);

      expect(getRequestsGuards).toBeDefined();
      expect(getRequestsGuards[0]).toBe(GqlAuthGuard);

      expect(getRequestGuards).toBeDefined();
      expect(getRequestGuards[0]).toBe(GqlAuthGuard);
    });

    it('should have GqlAuthGuard and RolesGuard applied to createRequest mutation', () => {
      const guards = Reflect.getMetadata('__guards__', RequestsResolver.prototype.createRequest);
      expect(guards).toBeDefined();
      expect(guards).toContain(GqlAuthGuard);
      expect(guards).toContain(RolesGuard);
    });

    it('should have correct role restrictions on createRequest', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, RequestsResolver.prototype.createRequest);
      expect(roles).toEqual([Role.REQUESTER, Role.FACILITY_MANAGER, Role.ADMIN]);
    });

    it('should have GqlAuthGuard and RolesGuard applied to upvoteRequest mutation', () => {
      const guards = Reflect.getMetadata('__guards__', RequestsResolver.prototype.upvoteRequest);
      expect(guards).toBeDefined();
      expect(guards).toContain(GqlAuthGuard);
      expect(guards).toContain(RolesGuard);

      const roles = Reflect.getMetadata(ROLES_KEY, RequestsResolver.prototype.upvoteRequest);
      expect(roles).toEqual([Role.REQUESTER, Role.TECHNICIAN, Role.FACILITY_MANAGER, Role.ADMIN]);
    });
  });

  describe('RolesGuard Enforcement on Requests', () => {
    let reflector: Reflector;
    let rolesGuard: RolesGuard;

    beforeEach(() => {
      reflector = new Reflector();
      rolesGuard = new RolesGuard(reflector);
    });

    const createMockExecutionContext = (userRole: Role | null) => {
      return {
        getHandler: () => RequestsResolver.prototype.createRequest,
        getClass: () => RequestsResolver,
        getArgs: () => [{}, {}, { req: { user: userRole ? { role: userRole } : null } }, {}],
        getType: () => 'graphql',
      } as unknown as ExecutionContext;
    };

    it('should allow authorized roles (REQUESTER, FACILITY_MANAGER, ADMIN) to create requests', () => {
      const requesterCtx = createMockExecutionContext(Role.REQUESTER);
      expect(rolesGuard.canActivate(requesterCtx)).toBe(true);

      const managerCtx = createMockExecutionContext(Role.FACILITY_MANAGER);
      expect(rolesGuard.canActivate(managerCtx)).toBe(true);

      const adminCtx = createMockExecutionContext(Role.ADMIN);
      expect(rolesGuard.canActivate(adminCtx)).toBe(true);
    });

    it('should deny unauthorized roles from creating requests', () => {
      const technicianCtx = createMockExecutionContext(Role.TECHNICIAN);
      expect(() => rolesGuard.canActivate(technicianCtx)).toThrow(ForbiddenException);
      expect(() => rolesGuard.canActivate(technicianCtx)).toThrow(/Access denied. Required role\(s\)/);
    });

    it('should throw ForbiddenException if user security context is missing', () => {
      const noUserCtx = createMockExecutionContext(null);
      expect(() => rolesGuard.canActivate(noUserCtx)).toThrow(ForbiddenException);
    });
  });

  describe('Resolver Methods Delegation', () => {
    const mockUser = { id: 'usr-1', role: Role.REQUESTER } as any;

    it('getRequests should delegate to requestsService.findAll', async () => {
      const filter = { search: 'test' };
      await resolver.getRequests(filter, mockUser);
      expect(requestsService.findAll).toHaveBeenCalledWith(filter, mockUser);
    });

    it('getRequest should delegate to requestsService.findById', async () => {
      await resolver.getRequest('req-1', mockUser);
      expect(requestsService.findById).toHaveBeenCalledWith('req-1', mockUser);
    });

    it('createRequest should delegate to requestsService.create with authenticated user', async () => {
      const input = { title: 'Test', description: 'Desc', locationId: 'loc-1' };
      await resolver.createRequest(input, mockUser);
      expect(requestsService.create).toHaveBeenCalledWith(input, mockUser);
    });

    it('upvoteRequest should delegate to requestsService.upvote with authenticated user', async () => {
      await resolver.upvoteRequest('req-1', mockUser);
      expect(requestsService.upvote).toHaveBeenCalledWith('req-1', mockUser);
    });

    it('suggestDuplicateRequests should delegate to requestsService.suggestDuplicates', async () => {
      (requestsService.suggestDuplicates as any) = jest.fn().mockResolvedValue([]);
      await resolver.suggestDuplicateRequests('water leak', 'loc-1');
      expect(requestsService.suggestDuplicates).toHaveBeenCalledWith('water leak', 'loc-1');
    });

    it('overridePriority should delegate to requestsService.overridePriority', async () => {
      (requestsService.overridePriority as any) = jest.fn().mockResolvedValue({ id: 'req-1' });
      await resolver.overridePriority('req-1', Priority.CRITICAL, 'Emergency', mockUser);
      expect(requestsService.overridePriority).toHaveBeenCalledWith('req-1', Priority.CRITICAL, 'Emergency', mockUser);
    });

    it('reopenRequest should delegate to requestsService.reopenRequest', async () => {
      (requestsService.reopenRequest as any) = jest.fn().mockResolvedValue({ id: 'req-1' });
      await resolver.reopenRequest('req-1', 'Still leaking', mockUser);
      expect(requestsService.reopenRequest).toHaveBeenCalledWith('req-1', 'Still leaking', mockUser);
    });
  });
});
