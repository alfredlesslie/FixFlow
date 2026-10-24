import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Role, AccountStatus, ApplicationStatus } from '@prisma/client';
import {
  AccountLifecycleEngine,
  UserState,
  ApplicationState,
} from './account-lifecycle.engine';

export { AccountLifecycleEngine, UserState, ApplicationState };


describe('FixFlow Account Lifecycle Engine (Phase 6C.3)', () => {
  const requesterUser: UserState = {
    id: 'usr-req-1',
    email: 'student@fixflow.edu',
    role: Role.REQUESTER,
    status: AccountStatus.PENDING_VERIFICATION,
    emailVerified: false,
    tokenVersion: 0,
    isActive: true,
  };

  const techUser: UserState = {
    id: 'usr-tech-1',
    email: 'tech@fixflow.edu',
    role: Role.TECHNICIAN,
    status: AccountStatus.PENDING_VERIFICATION,
    emailVerified: false,
    tokenVersion: 0,
    isActive: true,
  };

  const adminUser: UserState = {
    id: 'usr-admin-1',
    email: 'admin@fixflow.edu',
    role: Role.ADMIN,
    status: AccountStatus.ACTIVE,
    emailVerified: false, // Legacy admin: active for recovery, but unverified email
    tokenVersion: 0,
    isActive: true,
  };

  describe('1. Email Verification State Transitions', () => {
    it('transitions REQUESTER from PENDING_VERIFICATION to ACTIVE upon email verification', () => {
      const nextStatus = AccountLifecycleEngine.onEmailVerified(requesterUser, Role.REQUESTER);
      expect(nextStatus).toBe(AccountStatus.ACTIVE);
    });

    it('transitions TECHNICIAN from PENDING_VERIFICATION to PENDING_APPROVAL upon email verification', () => {
      const nextStatus = AccountLifecycleEngine.onEmailVerified(techUser, Role.TECHNICIAN);
      expect(nextStatus).toBe(AccountStatus.PENDING_APPROVAL);
    });

    it('transitions FACILITY_MANAGER from PENDING_VERIFICATION to PENDING_APPROVAL upon email verification', () => {
      const facultyUser: UserState = {
        ...requesterUser,
        id: 'usr-fac-1',
        email: 'prof@fixflow.edu',
      };
      const nextStatus = AccountLifecycleEngine.onEmailVerified(facultyUser, Role.FACILITY_MANAGER);
      expect(nextStatus).toBe(AccountStatus.PENDING_APPROVAL);
    });

    it('rejects public self-registration for ADMIN role', () => {
      expect(() => {
        AccountLifecycleEngine.onEmailVerified(requesterUser, Role.ADMIN);
      }).toThrow(ForbiddenException);
    });
  });

  describe('2. Administrator Application Review & Self-Approval Prevention', () => {
    const techApplication: ApplicationState = {
      id: 'app-001',
      userId: 'usr-tech-1',
      requestedRole: Role.TECHNICIAN,
      status: ApplicationStatus.PENDING_REVIEW,
    };

    it('allows an active administrator to approve an application', () => {
      const result = AccountLifecycleEngine.reviewApplication(techApplication, adminUser, 'APPROVE');
      expect(result.userStatus).toBe(AccountStatus.ACTIVE);
      expect(result.appStatus).toBe(ApplicationStatus.APPROVED);
    });

    it('allows an active administrator to reject an application with reason', () => {
      const result = AccountLifecycleEngine.reviewApplication(
        techApplication,
        adminUser,
        'REJECT',
        'Incomplete EPA certification documentation',
      );
      expect(result.userStatus).toBe(AccountStatus.REJECTED);
      expect(result.appStatus).toBe(ApplicationStatus.REJECTED);
      expect(result.rejectionReason).toBe('Incomplete EPA certification documentation');
    });

    it('prevents applicants from approving their own application (Self-Approval Guard)', () => {
      const selfAdminApplicant: UserState = {
        id: 'usr-self-approver',
        email: 'badactor@fixflow.edu',
        role: Role.ADMIN,
        status: AccountStatus.ACTIVE,
        emailVerified: true,
        tokenVersion: 0,
        isActive: true,
      };

      const selfApplication: ApplicationState = {
        id: 'app-self',
        userId: 'usr-self-approver',
        requestedRole: Role.FACILITY_MANAGER,
        status: ApplicationStatus.PENDING_REVIEW,
      };

      expect(() => {
        AccountLifecycleEngine.reviewApplication(selfApplication, selfAdminApplicant, 'APPROVE');
      }).toThrow(ForbiddenException);
    });

    it('prevents non-administrators from reviewing applications', () => {
      const technicianReviewer: UserState = {
        ...techUser,
        status: AccountStatus.ACTIVE,
      };

      expect(() => {
        AccountLifecycleEngine.reviewApplication(techApplication, technicianReviewer, 'APPROVE');
      }).toThrow(ForbiddenException);
    });
  });

  describe('3. Authentication Enforcement Across Account States', () => {
    it('permits ACTIVE users to authenticate', () => {
      const activeUser: UserState = { ...requesterUser, status: AccountStatus.ACTIVE };
      expect(() => AccountLifecycleEngine.assertCanAuthenticate(activeUser)).not.toThrow();
    });

    it('blocks PENDING_VERIFICATION users from authenticating', () => {
      expect(() => AccountLifecycleEngine.assertCanAuthenticate(requesterUser)).toThrow(UnauthorizedException);
    });

    it('blocks PENDING_APPROVAL users from authenticating', () => {
      const pendingApprovalUser: UserState = { ...techUser, status: AccountStatus.PENDING_APPROVAL };
      expect(() => AccountLifecycleEngine.assertCanAuthenticate(pendingApprovalUser)).toThrow(UnauthorizedException);
    });

    it('blocks REJECTED users from authenticating', () => {
      const rejectedUser: UserState = { ...techUser, status: AccountStatus.REJECTED };
      expect(() => AccountLifecycleEngine.assertCanAuthenticate(rejectedUser)).toThrow(UnauthorizedException);
    });

    it('blocks SUSPENDED users from authenticating', () => {
      const suspendedUser: UserState = { ...techUser, status: AccountStatus.SUSPENDED };
      expect(() => AccountLifecycleEngine.assertCanAuthenticate(suspendedUser)).toThrow(UnauthorizedException);
    });
  });

  describe('4. Historical Reapplication & Suspension Isolation', () => {
    it('allows a rejected applicant to submit a new application while preserving history', () => {
      const rejectedUser: UserState = {
        ...techUser,
        status: AccountStatus.REJECTED,
        emailVerified: true,
      };

      const previousRejectedApp: ApplicationState = {
        id: 'app-prev',
        userId: rejectedUser.id,
        requestedRole: Role.TECHNICIAN,
        status: ApplicationStatus.REJECTED,
        rejectionReason: 'Invalid certification',
      };

      const reapplication = AccountLifecycleEngine.submitReapplication(
        rejectedUser,
        previousRejectedApp,
        Role.TECHNICIAN,
      );

      // Previous application remains REJECTED
      expect(previousRejectedApp.status).toBe(ApplicationStatus.REJECTED);
      // New application state is PENDING_REVIEW
      expect(reapplication.newAppStatus).toBe(ApplicationStatus.PENDING_REVIEW);
      // User moves to PENDING_APPROVAL (not ACTIVE!)
      expect(reapplication.userStatus).toBe(AccountStatus.PENDING_APPROVAL);
    });

    it('prohibits suspended users from bypassing suspension by reapplying', () => {
      const suspendedUser: UserState = {
        ...techUser,
        status: AccountStatus.SUSPENDED,
      };

      const previousApp: ApplicationState = {
        id: 'app-prev',
        userId: suspendedUser.id,
        requestedRole: Role.TECHNICIAN,
        status: ApplicationStatus.REJECTED,
      };

      expect(() => {
        AccountLifecycleEngine.submitReapplication(suspendedUser, previousApp, Role.TECHNICIAN);
      }).toThrow(ForbiddenException);
    });
  });
});
