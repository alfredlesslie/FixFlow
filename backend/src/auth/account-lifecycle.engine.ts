import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Role, AccountStatus, ApplicationStatus } from '../common/enums';

export interface UserState {
  id: string;
  email: string;
  role: Role;
  status: AccountStatus;
  emailVerified: boolean;
  tokenVersion: number;
  isActive: boolean;
}

export interface ApplicationState {
  id: string;
  userId: string;
  requestedRole: Role;
  status: ApplicationStatus;
  rejectionReason?: string | null;
  reviewedById?: string | null;
  reviewedAt?: Date | null;
}

/**
 * Pure domain state transition engine for FixFlow Account Lifecycle.
 * Encodes institutional RBAC and lifecycle rules.
 */
export class AccountLifecycleEngine {
  /**
   * Determine user status transition upon successful email verification token consumption.
   */
  static onEmailVerified(user: UserState, requestedRole: Role): AccountStatus {
    if (user.status !== AccountStatus.PENDING_VERIFICATION) {
      throw new Error(`Cannot verify email for user in status ${user.status}`);
    }

    if (requestedRole === Role.REQUESTER) {
      // Requesters become immediately ACTIVE upon institutional email verification
      return AccountStatus.ACTIVE;
    } else if (requestedRole === Role.TECHNICIAN || requestedRole === Role.FACILITY_MANAGER) {
      // Elevated roles require administrator review and approval
      return AccountStatus.PENDING_APPROVAL;
    } else {
      throw new ForbiddenException('Direct registration for administrator role is strictly prohibited');
    }
  }

  /**
   * Review a registration application.
   * Enforces that reviewer must be an active administrator and cannot review their own application.
   */
  static reviewApplication(
    application: ApplicationState,
    reviewer: UserState,
    decision: 'APPROVE' | 'REJECT',
    rejectionReason?: string,
  ): { userStatus: AccountStatus; appStatus: ApplicationStatus; rejectionReason?: string | null } {
    if (reviewer.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can review registration applications');
    }

    if (reviewer.status !== AccountStatus.ACTIVE || !reviewer.isActive) {
      throw new UnauthorizedException('Reviewer account is not active');
    }

    if (reviewer.id === application.userId) {
      throw new ForbiddenException('Self-approval prohibited: Faculty or staff cannot approve their own application');
    }

    if (application.status !== ApplicationStatus.PENDING_REVIEW) {
      throw new Error('Application has already been reviewed');
    }

    if (decision === 'APPROVE') {
      return {
        userStatus: AccountStatus.ACTIVE,
        appStatus: ApplicationStatus.APPROVED,
        rejectionReason: null,
      };
    } else {
      if (!rejectionReason || rejectionReason.trim().length === 0) {
        throw new Error('A documented rejection reason is required when rejecting an application');
      }
      return {
        userStatus: AccountStatus.REJECTED,
        appStatus: ApplicationStatus.REJECTED,
        rejectionReason: rejectionReason.trim(),
      };
    }
  }

  /**
   * Check whether a user is permitted to authenticate and access general operations.
   */
  static assertCanAuthenticate(user: UserState): void {
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    switch (user.status) {
      case AccountStatus.ACTIVE:
        return; // Permitted
      case AccountStatus.PENDING_VERIFICATION:
        throw new UnauthorizedException('Account pending email verification');
      case AccountStatus.PENDING_APPROVAL:
        throw new UnauthorizedException('Account pending administrator approval');
      case AccountStatus.REJECTED:
        throw new UnauthorizedException('Registration application was rejected');
      case AccountStatus.SUSPENDED:
        throw new UnauthorizedException('Account has been suspended by an administrator');
      default:
        throw new UnauthorizedException('Invalid account status');
    }
  }

  /**
   * Process a reapplication from a previously rejected applicant.
   * Historical applications remain preserved; new application is created in PENDING_REVIEW.
   */
  static submitReapplication(
    user: UserState,
    previousApplication: ApplicationState,
    newRequestedRole: Role,
  ): { userStatus: AccountStatus; newAppStatus: ApplicationStatus } {
    if (user.status === AccountStatus.SUSPENDED) {
      throw new ForbiddenException('Suspended accounts cannot reapply; institutional clearance required');
    }

    if (user.status !== AccountStatus.REJECTED) {
      throw new Error('Reapplication is only permitted for rejected applicants');
    }

    if (previousApplication.status !== ApplicationStatus.REJECTED) {
      throw new Error('Previous application is not rejected');
    }

    if (newRequestedRole === Role.ADMIN) {
      throw new ForbiddenException('Cannot apply for administrator role');
    }

    if (newRequestedRole !== Role.TECHNICIAN && newRequestedRole !== Role.FACILITY_MANAGER) {
      throw new ForbiddenException('Reapplication role must be either TECHNICIAN or FACILITY_MANAGER');
    }

    // Previous application remains ApplicationStatus.REJECTED in historical record.
    // User status moves to PENDING_APPROVAL (since email is already verified) or PENDING_VERIFICATION.
    const nextUserStatus = user.emailVerified ? AccountStatus.PENDING_APPROVAL : AccountStatus.PENDING_VERIFICATION;

    return {
      userStatus: nextUserStatus,
      newAppStatus: ApplicationStatus.PENDING_REVIEW,
    };
  }
}
