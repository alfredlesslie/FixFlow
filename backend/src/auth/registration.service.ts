import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { VerificationTokenService } from './verification-token.service';
import { AuditService } from '../audit/audit.service';
import { RegisterRequesterInput, RegisterStaffInput } from './dto/register.input';
import { ReapplyInput } from './dto/reapply.input';
import { RegistrationResponse, VerifyEmailResponse, OperationStatusResponse } from './dto/registration-response.type';
import { Role, AccountStatus, ApplicationStatus } from '../common/enums';
import { AccountLifecycleEngine } from './account-lifecycle.engine';

@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly verificationTokenService: VerificationTokenService,
    private readonly auditService: AuditService,
    @Optional() private readonly configService?: ConfigService,
  ) {}

  private getFrontendUrl(): string {
    return this.configService?.get<string>('FRONTEND_URL') || process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  /**
   * Register an institutional requester (student, staff, or faculty submitting requests).
   */
  async registerRequester(input: RegisterRequesterInput): Promise<RegistrationResponse> {
    const email = input.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      let emailDispatched = true;
      // Enumeration mitigation: do not leak existence via error; re-dispatch verification if unverified
      if (!existing.emailVerified) {
        const token = await this.verificationTokenService.createVerificationToken(existing.id, 24);
        const verificationUrl = `${this.getFrontendUrl()}/verify-email?token=${token.rawToken}`;
        emailDispatched = await this.mailService.sendVerificationEmail({
          recipientEmail: existing.email,
          recipientName: `${existing.firstName} ${existing.lastName}`,
          tokenMasked: token.tokenMasked,
          rawToken: token.rawToken,
          verificationUrl,
          expiresInHours: 24,
        });
      }
      return {
        success: true,
        emailDispatched,
        message: emailDispatched
          ? 'Registration submitted. Please check your institutional email to complete verification.'
          : 'Account exists and is pending verification, but email delivery could not be completed. Please ensure Mailpit is running and click Resend.',
        status: AccountStatus.PENDING_VERIFICATION,
      };
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const { user, tokenResult } = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          role: Role.REQUESTER,
          status: AccountStatus.PENDING_VERIFICATION,
          emailVerified: false,
          department: input.department?.trim() || null,
          phone: input.phone?.trim() || null,
          institutionalId: input.institutionalId?.trim() || null,
          isActive: true,
        },
      });

      const token = await this.verificationTokenService.createVerificationToken(newUser.id, 24, tx);

      await tx.auditLog.create({
        data: {
          actorId: newUser.id,
          action: 'USER_REGISTER_REQUESTER',
          entity: 'USER',
          entityId: newUser.id,
          metadata: { email: newUser.email, role: Role.REQUESTER },
        },
      });

      return { user: newUser, tokenResult: token };
    });

    // Send verification email via abstraction (masks token in logs; retains rawToken in non-prod mock)
    const verificationUrl = `${this.getFrontendUrl()}/verify-email?token=${tokenResult.rawToken}`;
    const emailDispatched = await this.mailService.sendVerificationEmail({
      recipientEmail: user.email,
      recipientName: `${user.firstName} ${user.lastName}`,
      tokenMasked: tokenResult.tokenMasked,
      rawToken: tokenResult.rawToken,
      verificationUrl,
      expiresInHours: 24,
    });

    return {
      success: true,
      emailDispatched,
      message: emailDispatched
        ? 'Registration submitted. Please check your institutional email to complete verification.'
        : 'Registration submitted and account created, but verification email delivery could not be completed. Please ensure Mailpit is running and click Resend.',
      status: AccountStatus.PENDING_VERIFICATION,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`.trim(),
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        emailVerifiedAt: user.emailVerifiedAt,
        tokenVersion: user.tokenVersion,
        institutionalId: user.institutionalId,
        department: user.department,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  /**
   * Register institutional staff (technician or facility manager) requiring email verification and admin approval.
   */
  async registerStaff(input: RegisterStaffInput): Promise<RegistrationResponse> {
    const email = input.email.toLowerCase().trim();

    if (input.requestedRole === Role.ADMIN) {
      throw new ForbiddenException('Direct registration for administrator role is strictly prohibited');
    }

    if (input.requestedRole !== Role.TECHNICIAN && input.requestedRole !== Role.FACILITY_MANAGER) {
      throw new BadRequestException('Requested role must be either TECHNICIAN or FACILITY_MANAGER');
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      let emailDispatched = true;
      // Enumeration mitigation: do not leak existence via error; re-dispatch verification if unverified
      if (!existing.emailVerified) {
        const token = await this.verificationTokenService.createVerificationToken(existing.id, 24);
        const verificationUrl = `${this.getFrontendUrl()}/verify-email?token=${token.rawToken}`;
        emailDispatched = await this.mailService.sendVerificationEmail({
          recipientEmail: existing.email,
          recipientName: `${existing.firstName} ${existing.lastName}`,
          tokenMasked: token.tokenMasked,
          rawToken: token.rawToken,
          verificationUrl,
          expiresInHours: 24,
        });
      }
      return {
        success: true,
        emailDispatched,
        message: emailDispatched
          ? 'Registration submitted. Please verify your email; once verified, an administrator will review your application.'
          : 'Application exists and is pending verification, but email delivery could not be completed. Please ensure Mailpit is running and click Resend.',
        status: AccountStatus.PENDING_VERIFICATION,
      };
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const applicantFullName = `${input.firstName} ${input.lastName}`.trim();

    const { user, application, tokenResult } = await this.prisma.$transaction(async (tx) => {
      // Create user account initially as REQUESTER in PENDING_VERIFICATION until approved
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          role: Role.REQUESTER,
          status: AccountStatus.PENDING_VERIFICATION,
          emailVerified: false,
          department: input.department.trim(),
          phone: input.contactNumber.trim(),
          institutionalId: input.institutionalId.trim(),
          isActive: true,
        },
      });

      const newApp = await tx.registrationApplication.create({
        data: {
          userId: newUser.id,
          applicantName: applicantFullName,
          applicantEmail: email,
          institutionalId: input.institutionalId.trim(),
          department: input.department.trim(),
          contactNumber: input.contactNumber.trim(),
          requestedRole: input.requestedRole,
          status: ApplicationStatus.PENDING_REVIEW,
          emailVerified: false,
          tradeDiscipline: input.tradeDiscipline?.trim() || null,
          certificationNumber: input.certificationNumber?.trim() || null,
          yearsExperience: input.yearsExperience?.trim() || null,
          facilityScope: input.facilityScope?.trim() || null,
          appointmentJustification: input.appointmentJustification?.trim() || null,
        },
      });

      const token = await this.verificationTokenService.createVerificationToken(newUser.id, 24, tx);

      await tx.auditLog.create({
        data: {
          actorId: newUser.id,
          action: 'USER_REGISTER_STAFF_APPLICATION',
          entity: 'REGISTRATION_APPLICATION',
          entityId: newApp.id,
          metadata: {
            email: newUser.email,
            requestedRole: input.requestedRole,
            department: input.department,
          },
        },
      });

      return { user: newUser, application: newApp, tokenResult: token };
    });

    const verificationUrl = `${this.getFrontendUrl()}/verify-email?token=${tokenResult.rawToken}`;
    const emailDispatched = await this.mailService.sendVerificationEmail({
      recipientEmail: user.email,
      recipientName: applicantFullName,
      tokenMasked: tokenResult.tokenMasked,
      rawToken: tokenResult.rawToken,
      verificationUrl,
      expiresInHours: 24,
    });

    return {
      success: true,
      emailDispatched,
      message: emailDispatched
        ? 'Registration submitted. Please verify your email; once verified, an administrator will review your application.'
        : 'Registration submitted, but verification email delivery could not be completed. Please ensure Mailpit is running and click Resend.',
      status: AccountStatus.PENDING_VERIFICATION,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: applicantFullName,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        emailVerifiedAt: user.emailVerifiedAt,
        tokenVersion: user.tokenVersion,
        institutionalId: user.institutionalId,
        department: user.department,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      applicationId: application.id,
    };
  }

  /**
   * Consumes an email verification token and transitions account state atomically.
   */
  async verifyEmail(rawToken: string): Promise<VerifyEmailResponse> {
    return this.prisma.$transaction(async (tx) => {
      const tokenRecord = await this.verificationTokenService.validateAndConsumeToken(rawToken, tx);

      const user = await tx.user.findUnique({
        where: { id: tokenRecord.userId },
        include: {
          registrationApplications: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User account associated with this token was not found');
      }

      if (user.emailVerified && user.status === AccountStatus.ACTIVE) {
        return {
          success: true,
          message: 'Email address has already been verified.',
          status: user.status,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            name: `${user.firstName} ${user.lastName}`.trim(),
            role: user.role,
            status: user.status,
            emailVerified: user.emailVerified,
            emailVerifiedAt: user.emailVerifiedAt,
            tokenVersion: user.tokenVersion,
            institutionalId: user.institutionalId,
            department: user.department,
            phone: user.phone,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        };
      }

      // Determine target role from latest application or existing user role
      const latestApp = user.registrationApplications[0];
      const requestedRole = latestApp ? latestApp.requestedRole : user.role;

      // Determine next lifecycle status via domain rules
      const nextStatus = AccountLifecycleEngine.onEmailVerified(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          emailVerified: user.emailVerified,
          tokenVersion: user.tokenVersion,
          isActive: user.isActive,
        },
        requestedRole,
      );

      if (latestApp) {
        await tx.registrationApplication.update({
          where: { id: latestApp.id },
          data: { emailVerified: true },
        });
      }

      const verifiedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          status: nextStatus,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: verifiedUser.id,
          action: 'USER_EMAIL_VERIFIED',
          entity: 'USER',
          entityId: verifiedUser.id,
          metadata: {
            newStatus: nextStatus,
            requestedRole,
          },
        },
      });

      const message =
        nextStatus === AccountStatus.ACTIVE
          ? 'Email verified successfully. You may now log in.'
          : 'Email verified successfully. Your application is now queued for administrator review.';

      return {
        success: true,
        message,
        status: nextStatus,
        user: {
          id: verifiedUser.id,
          email: verifiedUser.email,
          firstName: verifiedUser.firstName,
          lastName: verifiedUser.lastName,
          name: `${verifiedUser.firstName} ${verifiedUser.lastName}`.trim(),
          role: verifiedUser.role,
          status: verifiedUser.status,
          emailVerified: verifiedUser.emailVerified,
          emailVerifiedAt: verifiedUser.emailVerifiedAt,
          tokenVersion: verifiedUser.tokenVersion,
          institutionalId: verifiedUser.institutionalId,
          department: verifiedUser.department,
          phone: verifiedUser.phone,
          isActive: verifiedUser.isActive,
          createdAt: verifiedUser.createdAt,
          updatedAt: verifiedUser.updatedAt,
        },
      };
    });
  }

  /**
   * Resends a verification email if account is not yet verified.
   */
  async resendVerificationEmail(email: string): Promise<OperationStatusResponse> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Consistent response to prevent account enumeration
    if (!user || user.emailVerified) {
      return {
        success: true,
        emailDispatched: true,
        message: 'If an unverified account exists for this email, a verification link has been dispatched.',
      };
    }

    const tokenResult = await this.verificationTokenService.createVerificationToken(user.id, 24);
    const verificationUrl = `${this.getFrontendUrl()}/verify-email?token=${tokenResult.rawToken}`;

    const emailDispatched = await this.mailService.sendVerificationEmail({
      recipientEmail: user.email,
      recipientName: `${user.firstName} ${user.lastName}`,
      tokenMasked: tokenResult.tokenMasked,
      rawToken: tokenResult.rawToken,
      verificationUrl,
      expiresInHours: 24,
    });

    if (!emailDispatched) {
      return {
        success: false,
        emailDispatched: false,
        message: 'Mail delivery failed. The campus mail service is currently unavailable. Please verify that Mailpit is running and retry.',
      };
    }

    return {
      success: true,
      emailDispatched: true,
      message: 'A fresh verification link has been successfully dispatched to your institutional inbox.',
    };
  }

  /**
   * Reapplication for rejected applicants. Preserves historical applications in audit history.
   */
  async reapply(userId: string, input: ReapplyInput): Promise<RegistrationResponse> {
    if (input.requestedRole === Role.ADMIN) {
      throw new ForbiddenException('Cannot apply for administrator role');
    }

    if (input.requestedRole !== Role.TECHNICIAN && input.requestedRole !== Role.FACILITY_MANAGER) {
      throw new BadRequestException('Requested role must be either TECHNICIAN or FACILITY_MANAGER');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        registrationApplications: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User account not found');
    }

    const previousApp = user.registrationApplications[0];
    if (!previousApp) {
      throw new BadRequestException('No previous registration application exists for this user');
    }

    const transition = AccountLifecycleEngine.submitReapplication(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        tokenVersion: user.tokenVersion,
        isActive: user.isActive,
      },
      {
        id: previousApp.id,
        userId: user.id,
        requestedRole: previousApp.requestedRole,
        status: previousApp.status,
        rejectionReason: previousApp.rejectionReason,
      },
      input.requestedRole,
    );

    const applicantFullName = `${user.firstName} ${user.lastName}`.trim();

    const { application, updatedUser } = await this.prisma.$transaction(async (tx) => {
      // Previous application remains REJECTED in database
      const newApp = await tx.registrationApplication.create({
        data: {
          userId: user.id,
          applicantName: applicantFullName,
          applicantEmail: user.email,
          institutionalId: input.institutionalId.trim(),
          department: input.department.trim(),
          contactNumber: input.contactNumber.trim(),
          requestedRole: input.requestedRole,
          status: ApplicationStatus.PENDING_REVIEW,
          emailVerified: user.emailVerified,
          tradeDiscipline: input.tradeDiscipline?.trim() || null,
          certificationNumber: input.certificationNumber?.trim() || null,
          yearsExperience: input.yearsExperience?.trim() || null,
          facilityScope: input.facilityScope?.trim() || null,
          appointmentJustification: input.appointmentJustification?.trim() || null,
        },
      });

      const updated = await tx.user.update({
        where: { id: user.id },
        data: {
          status: transition.userStatus,
          department: input.department.trim(),
          phone: input.contactNumber.trim(),
          institutionalId: input.institutionalId.trim(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: 'USER_REAPPLY_REGISTRATION',
          entity: 'REGISTRATION_APPLICATION',
          entityId: newApp.id,
          metadata: {
            previousAppId: previousApp.id,
            requestedRole: input.requestedRole,
            newStatus: transition.userStatus,
          },
        },
      });

      return { application: newApp, updatedUser: updated };
    });

    return {
      success: true,
      message: 'Reapplication submitted successfully and is queued for administrator review.',
      status: transition.userStatus,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        name: applicantFullName,
        role: updatedUser.role,
        status: updatedUser.status,
        emailVerified: updatedUser.emailVerified,
        emailVerifiedAt: updatedUser.emailVerifiedAt,
        tokenVersion: updatedUser.tokenVersion,
        institutionalId: updatedUser.institutionalId,
        department: updatedUser.department,
        phone: updatedUser.phone,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
      applicationId: application.id,
    };
  }
}
