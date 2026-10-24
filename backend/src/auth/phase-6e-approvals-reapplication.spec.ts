import { ForbiddenException, BadRequestException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { RegistrationService } from './registration.service';
import { AdministratorApprovalsService } from './administrator-approvals.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { Role, AccountStatus, ApplicationStatus } from '../common/enums';
import { User } from '../users/models/user.model';
import { ReapplyInput } from './dto/reapply.input';
import { ALLOW_REJECTED_KEY } from '../common/decorators/allow-rejected.decorator';
import { ROLES_KEY } from '../common/decorators/roles.decorator';

describe('Phase 6E.2 & 6E.3 Integration Contract Verification', () => {
  let resolver: AuthResolver;
  let authService: Partial<AuthService>;
  let registrationService: Partial<RegistrationService>;
  let adminService: Partial<AdministratorApprovalsService>;
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  const rejectedTechUser: User = {
    id: 'u-tech-rejected',
    email: 'tech.applicant@fixflow.edu',
    firstName: 'Arun',
    lastName: 'Nair',
    name: 'Arun Nair',
    role: Role.TECHNICIAN,
    status: AccountStatus.REJECTED,
    emailVerified: true,
    tokenVersion: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const activeAdminUser: User = {
    id: 'u-admin-1',
    email: 'admin@fixflow.edu',
    firstName: 'Sarah',
    lastName: 'Connor',
    name: 'Sarah Connor',
    role: Role.ADMIN,
    status: AccountStatus.ACTIVE,
    emailVerified: true,
    tokenVersion: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const technicianUser: User = {
    id: 'u-tech-active',
    email: 'tech@fixflow.edu',
    firstName: 'Bob',
    lastName: 'Builder',
    name: 'Bob Builder',
    role: Role.TECHNICIAN,
    status: AccountStatus.ACTIVE,
    emailVerified: true,
    tokenVersion: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);

    authService = {
      login: jest.fn(),
    };

    registrationService = {
      reapply: jest.fn().mockImplementation(async (userId: string, input: ReapplyInput) => {
        if (input.requestedRole === Role.REQUESTER || input.requestedRole === Role.ADMIN) {
          throw new BadRequestException('Reapplication is only supported for staff roles (TECHNICIAN or FACILITY_MANAGER)');
        }
        return {
          success: true,
          message: 'Reapplication submitted successfully and is queued for administrator review.',
          status: AccountStatus.PENDING_APPROVAL,
          applicationId: 'app-reapplied-101',
          user: {
            ...rejectedTechUser,
            status: AccountStatus.PENDING_APPROVAL,
          },
        };
      }),
    };

    adminService = {
      getApplications: jest.fn().mockImplementation(async (status?: ApplicationStatus) => {
        const apps = [
          {
            id: 'app-1',
            userId: 'u-applicant-1',
            applicantName: 'Vikram Singh',
            applicantEmail: 'vikram@fixflow.edu',
            institutionalId: 'TECH-104',
            department: 'HVAC',
            contactNumber: '555-0199',
            requestedRole: Role.TECHNICIAN,
            status: ApplicationStatus.PENDING_REVIEW,
            emailVerified: true,
            submittedAt: new Date(),
          },
          {
            id: 'app-2',
            userId: 'u-applicant-2',
            applicantName: 'Priya Sharma',
            applicantEmail: 'priya@fixflow.edu',
            institutionalId: 'FM-201',
            department: 'Civil Operations',
            contactNumber: '555-0244',
            requestedRole: Role.FACILITY_MANAGER,
            status: ApplicationStatus.APPROVED,
            emailVerified: true,
            reviewedById: 'u-admin-1',
            reviewedAt: new Date(),
            submittedAt: new Date(),
          },
        ];
        if (status) return apps.filter((a) => a.status === status);
        return apps;
      }),
      getApplicationById: jest.fn().mockImplementation(async (id: string) => ({
        id,
        applicantName: 'Vikram Singh',
        status: ApplicationStatus.PENDING_REVIEW,
      })),
      approveApplication: jest.fn().mockImplementation(async (id: string, admin: User) => {
        if (id === 'app-self' && admin.id === 'u-admin-1') {
          throw new ForbiddenException('Administrators cannot approve their own registration application');
        }
        if (id === 'app-unverified') {
          throw new BadRequestException('Cannot approve application: applicant email is not verified');
        }
        return {
          id,
          status: ApplicationStatus.APPROVED,
          applicantName: 'Vikram Singh',
          requestedRole: Role.TECHNICIAN,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        };
      }),
      rejectApplication: jest.fn().mockImplementation(async (id: string, reason: string, admin: User) => {
        if (!reason || !reason.trim()) {
          throw new BadRequestException('A reason must be provided to reject an application');
        }
        if (id === 'app-self' && admin.id === 'u-admin-1') {
          throw new ForbiddenException('You cannot reject your own registration application');
        }
        return {
          id,
          status: ApplicationStatus.REJECTED,
          rejectionReason: reason.trim(),
          applicantName: 'Vikram Singh',
          reviewedById: admin.id,
          reviewedAt: new Date(),
        };
      }),
    };

    resolver = new AuthResolver(
      authService as AuthService,
      registrationService as RegistrationService,
      adminService as AdministratorApprovalsService,
      { getDevLatestToken: jest.fn() } as any,
    );
  });

  describe('Phase 6E.2: Rejected User Reapplication', () => {
    it('1. Reapply endpoint has @AllowRejected metadata permitting restricted session', () => {
      const handler = AuthResolver.prototype.reapplyRegistration;
      const allowRejected = Reflect.getMetadata(ALLOW_REJECTED_KEY, handler);
      expect(allowRejected).toBe(true);
    });

    it('2. Submits correct ReapplyInput to backend registrationService', async () => {
      const input: ReapplyInput = {
        requestedRole: Role.TECHNICIAN,
        department: 'HVAC & Climate Control',
        contactNumber: '+1 555-0199',
        institutionalId: 'TECH-2026-904',
        tradeDiscipline: 'HVAC & Climate Control',
        certificationNumber: 'HVAC-STATE-4421',
        yearsExperience: '5',
      };

      const result = await resolver.reapplyRegistration(input, rejectedTechUser);

      expect(registrationService.reapply).toHaveBeenCalledWith('u-tech-rejected', input);
      expect(result.success).toBe(true);
      expect(result.status).toBe(AccountStatus.PENDING_APPROVAL);
      expect(result.applicationId).toBe('app-reapplied-101');
    });

    it('3. Reapplication rejects non-staff roles (REQUESTER or ADMIN)', async () => {
      const invalidInput: ReapplyInput = {
        requestedRole: Role.REQUESTER,
        department: 'Student Affairs',
        contactNumber: '+1 555-0100',
        institutionalId: 'STU-100',
      };

      await expect(resolver.reapplyRegistration(invalidInput, rejectedTechUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('4. Reapplication preserves applicant identity from authenticated token context', async () => {
      const input: ReapplyInput = {
        requestedRole: Role.FACILITY_MANAGER,
        department: 'Campus Administration',
        contactNumber: '+1 555-0800',
        institutionalId: 'FM-2026-001',
        facilityScope: 'Central Academic Complex',
        appointmentJustification: 'Campus Board appointment letter on file',
      };

      await resolver.reapplyRegistration(input, rejectedTechUser);
      expect(registrationService.reapply).toHaveBeenCalledWith(rejectedTechUser.id, input);
    });
  });

  describe('Phase 6E.3: Administrator Registration Approvals', () => {
    function createMockContext(user: User, handler: any): ExecutionContext {
      return {
        getHandler: () => handler,
        getClass: () => AuthResolver,
        getArgs: () => [],
        getArgByIndex: () => ({}),
        switchToHttp: () => ({} as any),
        switchToRpc: () => ({} as any),
        switchToWs: () => ({} as any),
        getType: () => 'graphql' as any,
      } as unknown as ExecutionContext;
    }

    it('5. Admin operations require Role.ADMIN metadata', () => {
      const approveHandler = AuthResolver.prototype.approveRegistrationApplication;
      const rejectHandler = AuthResolver.prototype.rejectRegistrationApplication;
      const listHandler = AuthResolver.prototype.getRegistrationApplications;

      expect(Reflect.getMetadata(ROLES_KEY, approveHandler)).toEqual([Role.ADMIN]);
      expect(Reflect.getMetadata(ROLES_KEY, rejectHandler)).toEqual([Role.ADMIN]);
      expect(Reflect.getMetadata(ROLES_KEY, listHandler)).toEqual([Role.ADMIN]);
    });

    it('6. Non-admin users cannot access admin approval operations (RolesGuard denies)', () => {
      jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
        getContext: () => ({ req: { user: technicianUser } }),
      } as any);

      const context = createMockContext(technicianUser, AuthResolver.prototype.approveRegistrationApplication);
      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('7. Admin users pass RolesGuard for approval operations', () => {
      jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
        getContext: () => ({ req: { user: activeAdminUser } }),
      } as any);

      const context = createMockContext(activeAdminUser, AuthResolver.prototype.approveRegistrationApplication);
      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it('8. Listing applications supports optional status filtering', async () => {
      const all = await resolver.getRegistrationApplications();
      expect(all.length).toBe(2);

      const pendingOnly = await resolver.getRegistrationApplications(ApplicationStatus.PENDING_REVIEW);
      expect(pendingOnly.length).toBe(1);
      expect(pendingOnly[0].status).toBe(ApplicationStatus.PENDING_REVIEW);
    });

    it('9. Approval calls backend and records reviewing admin', async () => {
      const result = await resolver.approveRegistrationApplication('app-1', activeAdminUser);
      expect(result.status).toBe(ApplicationStatus.APPROVED);
      expect(result.reviewedById).toBe('u-admin-1');
      expect(adminService.approveApplication).toHaveBeenCalledWith('app-1', activeAdminUser);
    });

    it('10. Self-approval is strictly prevented by backend authorization', async () => {
      await expect(
        resolver.approveRegistrationApplication('app-self', activeAdminUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('11. Unverified email applications cannot be approved', async () => {
      await expect(
        resolver.approveRegistrationApplication('app-unverified', activeAdminUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('12. Rejection requires non-empty reason and records audit trail', async () => {
      const reason = 'Invalid state license registration number.';
      const result = await resolver.rejectRegistrationApplication('app-1', reason, activeAdminUser);
      expect(result.status).toBe(ApplicationStatus.REJECTED);
      expect(result.rejectionReason).toBe(reason);
      expect(result.reviewedById).toBe('u-admin-1');

      await expect(
        resolver.rejectRegistrationApplication('app-1', '', activeAdminUser),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
