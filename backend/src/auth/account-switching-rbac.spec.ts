import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums';
import { UsersResolver } from '../users/users.resolver';
import { WorkOrdersResolver } from '../work-orders/work-orders.resolver';

describe('Account Switching, RBAC Isolation & Query Integrity Suite (Phase 6M)', () => {
  let rolesGuard: RolesGuard;
  let reflector: Reflector;
  let usersResolver: UsersResolver;
  let workOrdersResolver: WorkOrdersResolver;
  let mockWorkOrdersService: any;
  let mockPrisma: any;

  beforeEach(() => {
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);

    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    mockWorkOrdersService = {
      findAll: jest.fn().mockResolvedValue([
        { id: 'wo-1', title: 'Repair Pipe', assignedTechnician: { id: 'tech-1' } },
      ]),
      findById: jest.fn().mockImplementation((id: string) =>
        Promise.resolve({ id, title: 'Repair Pipe', assignedTechnician: { id: 'tech-1' } })
      ),
    };

    usersResolver = new UsersResolver(mockPrisma as any);
    workOrdersResolver = new WorkOrdersResolver(mockWorkOrdersService as any);
  });

  function createMockGqlContext(user?: { id: string; role: Role }) {
    return {
      getHandler: () => {},
      getClass: () => {},
      getArgs: () => [{}, {}, { req: { user } }, {}],
      getType: () => 'graphql',
    } as unknown as ExecutionContext;
  }

  describe('1. User.name Field Resolver Integrity', () => {
    it('correctly resolves full name from firstName and lastName for any user', () => {
      const user = { firstName: 'Rahul', lastName: 'Verma' };
      const resolvedName = usersResolver.getName(user as any);
      expect(resolvedName).toBe('Rahul Verma');
    });

    it('handles user with empty or missing lastName gracefully', () => {
      const user = { firstName: 'Admin', lastName: '' };
      const resolvedName = usersResolver.getName(user as any);
      expect(resolvedName).toBe('Admin');
    });

    it('handles user with null firstName and lastName gracefully', () => {
      const user = { firstName: null, lastName: null, email: 'test@campus.edu' };
      const resolvedName = usersResolver.getName(user as any);
      expect(resolvedName).toBe('test@campus.edu');
    });
  });

  describe('2. RolesGuard Authorization for Work Order Access', () => {
    it('allows TECHNICIAN to access technician-restricted work order operations', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        Role.TECHNICIAN,
        Role.FACILITY_MANAGER,
        Role.ADMIN,
      ]);
      const context = createMockGqlContext({ id: 'tech-1', role: Role.TECHNICIAN });
      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('allows FACILITY_MANAGER and ADMIN to access work order operations', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        Role.TECHNICIAN,
        Role.FACILITY_MANAGER,
        Role.ADMIN,
      ]);
      const fmContext = createMockGqlContext({ id: 'fm-1', role: Role.FACILITY_MANAGER });
      expect(rolesGuard.canActivate(fmContext)).toBe(true);

      const adminContext = createMockGqlContext({ id: 'admin-1', role: Role.ADMIN });
      expect(rolesGuard.canActivate(adminContext)).toBe(true);
    });

    it('STRICTLY BLOCKS REQUESTER from accessing work order operations with ForbiddenException', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        Role.TECHNICIAN,
        Role.FACILITY_MANAGER,
        Role.ADMIN,
      ]);
      const reqContext = createMockGqlContext({ id: 'student-1', role: Role.REQUESTER });
      expect(() => rolesGuard.canActivate(reqContext)).toThrow(ForbiddenException);
    });

    it('STRICTLY BLOCKS unauthenticated requests from accessing protected operations', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        Role.TECHNICIAN,
        Role.FACILITY_MANAGER,
        Role.ADMIN,
      ]);
      const anonContext = createMockGqlContext(undefined);
      expect(() => rolesGuard.canActivate(anonContext)).toThrow(ForbiddenException);
    });
  });

  describe('3. Technician Work Order Filtering Isolation', () => {
    it('delegates work orders query with authenticated technician ID filter', async () => {
      const filter = { assignedTechnicianId: 'tech-rahul-id' };
      const techUser = { id: 'tech-rahul-id', role: Role.TECHNICIAN };
      const results = await workOrdersResolver.getWorkOrders(filter as any, techUser as any);
      expect(mockWorkOrdersService.findAll).toHaveBeenCalledWith(filter, techUser);
      expect(results).toHaveLength(1);
    });
  });

  describe('4. Account Switching Transition & Strict Role Isolation', () => {
    it('enforces RBAC through rapid account-switching sequence (Requester -> Tech -> Admin -> Requester)', () => {
      // Step 1: Requester active session
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.REQUESTER]);
      const requesterContext = createMockGqlContext({ id: 'req-1', role: Role.REQUESTER });
      expect(rolesGuard.canActivate(requesterContext)).toBe(true);

      // Verify Requester is strictly blocked from Admin/Tech endpoints
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
      expect(() => rolesGuard.canActivate(requesterContext)).toThrow(ForbiddenException);

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.TECHNICIAN]);
      expect(() => rolesGuard.canActivate(requesterContext)).toThrow(ForbiddenException);

      // Step 2: Switch to Technician
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.TECHNICIAN]);
      const techContext = createMockGqlContext({ id: 'tech-1', role: Role.TECHNICIAN });
      expect(rolesGuard.canActivate(techContext)).toBe(true);

      // Technician cannot access Admin endpoint
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
      expect(() => rolesGuard.canActivate(techContext)).toThrow(ForbiddenException);

      // Step 3: Switch to Administrator
      const adminContext = createMockGqlContext({ id: 'admin-1', role: Role.ADMIN });
      expect(rolesGuard.canActivate(adminContext)).toBe(true);

      // Step 4: Switch back to Requester (No-refresh account switch)
      // Must not carry over any Admin or Tech authorization
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
      const postSwitchReqContext = createMockGqlContext({ id: 'req-1', role: Role.REQUESTER });
      expect(() => rolesGuard.canActivate(postSwitchReqContext)).toThrow(ForbiddenException);

      // Must allow legitimate requester operations
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.REQUESTER]);
      expect(rolesGuard.canActivate(postSwitchReqContext)).toBe(true);
    });

    it('enforces RBAC through extended account-switching sequence (Requester -> Manager -> Tech)', () => {
      // Requester -> Manager
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.FACILITY_MANAGER]);
      const fmContext = createMockGqlContext({ id: 'fm-1', role: Role.FACILITY_MANAGER });
      expect(rolesGuard.canActivate(fmContext)).toBe(true);

      // Manager -> Technician
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.TECHNICIAN]);
      const techContext = createMockGqlContext({ id: 'tech-1', role: Role.TECHNICIAN });
      expect(rolesGuard.canActivate(techContext)).toBe(true);

      // Ensure Technician cannot access FM-only endpoints
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.FACILITY_MANAGER]);
      expect(() => rolesGuard.canActivate(techContext)).toThrow(ForbiddenException);
    });

    it('rejects all operations when session is invalidated (unauthenticated/logged-out)', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        Role.REQUESTER,
        Role.TECHNICIAN,
        Role.FACILITY_MANAGER,
        Role.ADMIN,
      ]);
      const loggedOutContext = createMockGqlContext(undefined);
      expect(() => rolesGuard.canActivate(loggedOutContext)).toThrow(ForbiddenException);
    });
  });
});
