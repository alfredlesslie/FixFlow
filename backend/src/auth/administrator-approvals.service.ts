import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../users/models/user.model';
import { Role, AccountStatus, ApplicationStatus } from '../common/enums';
import { RegistrationApplication } from './models/registration-application.model';

@Injectable()
export class AdministratorApprovalsService {
  private readonly logger = new Logger(AdministratorApprovalsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List registration applications with optional status filter.
   */
  async getApplications(status?: ApplicationStatus): Promise<RegistrationApplication[]> {
    const apps = await this.prisma.registrationApplication.findMany({
      where: status ? { status } : undefined,
      orderBy: { submittedAt: 'desc' },
    });

    return apps.map((a) => this.mapApplication(a));
  }

  /**
   * Fetch single registration application by ID.
   */
  async getApplicationById(id: string): Promise<RegistrationApplication> {
    const app = await this.prisma.registrationApplication.findUnique({
      where: { id },
    });

    if (!app) {
      throw new NotFoundException(`Registration application with ID ${id} not found`);
    }

    return this.mapApplication(app);
  }

  /**
   * Approve a pending staff application.
   * Strictly enforces self-approval prohibition, updates role & status, and increments token version.
   */
  async approveApplication(applicationId: string, currentAdmin: User): Promise<RegistrationApplication> {
    if (currentAdmin.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can approve registration applications');
    }

    const approvedApp = await this.prisma.$transaction(async (tx) => {
      const application = await tx.registrationApplication.findUnique({
        where: { id: applicationId },
        include: { user: true },
      });

      if (!application) {
        throw new NotFoundException(`Registration application with ID ${applicationId} not found`);
      }

      if (application.userId === currentAdmin.id) {
        throw new ForbiddenException(
          'Self-approval prohibited: Faculty or staff cannot approve their own registration application',
        );
      }

      if (application.status !== ApplicationStatus.PENDING_REVIEW) {
        throw new BadRequestException(`Application is not in PENDING_REVIEW state (current: ${application.status})`);
      }

      // Mandatory check: staff applications cannot be approved until applicant email is confirmed
      if (!application.emailVerified || !application.user?.emailVerified) {
        throw new BadRequestException(
          'Cannot approve staff application: Applicant institutional email address has not been verified',
        );
      }

      if (application.user && application.user.status !== AccountStatus.PENDING_APPROVAL) {
        throw new BadRequestException(
          `Cannot approve staff application: Applicant account must be in PENDING_APPROVAL status (current: ${application.user.status})`,
        );
      }

      const updatedApp = await tx.registrationApplication.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.APPROVED,
          reviewedById: currentAdmin.id,
          reviewedAt: new Date(),
          rejectionReason: null,
        },
      });

      if (application.userId) {
        await tx.user.update({
          where: { id: application.userId },
          data: {
            status: AccountStatus.ACTIVE,
            role: application.requestedRole,
            tokenVersion: { increment: 1 },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: currentAdmin.id,
          action: 'ADMIN_APPROVE_REGISTRATION_APPLICATION',
          entity: 'REGISTRATION_APPLICATION',
          entityId: applicationId,
          metadata: {
            applicantId: application.userId,
            approvedRole: application.requestedRole,
            reviewerId: currentAdmin.id,
          },
        },
      });

      return updatedApp;
    });

    this.logger.log(
      `Application ${applicationId} approved for user ${approvedApp.userId} with role ${approvedApp.requestedRole} by admin ${currentAdmin.id}`,
    );

    return this.mapApplication(approvedApp);
  }

  /**
   * Reject a pending staff application with mandatory documented reason.
   */
  async rejectApplication(
    applicationId: string,
    reason: string,
    currentAdmin: User,
  ): Promise<RegistrationApplication> {
    if (currentAdmin.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can reject registration applications');
    }

    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('A documented rejection reason is required');
    }

    const rejectedApp = await this.prisma.$transaction(async (tx) => {
      const application = await tx.registrationApplication.findUnique({
        where: { id: applicationId },
      });

      if (!application) {
        throw new NotFoundException(`Registration application with ID ${applicationId} not found`);
      }

      if (application.userId === currentAdmin.id) {
        throw new ForbiddenException('Applicants cannot review or reject their own registration application');
      }

      if (application.status !== ApplicationStatus.PENDING_REVIEW) {
        throw new BadRequestException(`Application is not in PENDING_REVIEW state (current: ${application.status})`);
      }

      const updatedApp = await tx.registrationApplication.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.REJECTED,
          rejectionReason: reason.trim(),
          reviewedById: currentAdmin.id,
          reviewedAt: new Date(),
        },
      });

      if (application.userId) {
        await tx.user.update({
          where: { id: application.userId },
          data: {
            status: AccountStatus.REJECTED,
            tokenVersion: { increment: 1 },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: currentAdmin.id,
          action: 'ADMIN_REJECT_REGISTRATION_APPLICATION',
          entity: 'REGISTRATION_APPLICATION',
          entityId: applicationId,
          metadata: {
            applicantId: application.userId,
            rejectionReason: reason.trim(),
            reviewerId: currentAdmin.id,
          },
        },
      });

      return updatedApp;
    });

    this.logger.log(
      `Application ${applicationId} rejected for user ${rejectedApp.userId} by admin ${currentAdmin.id}. Reason: ${reason.trim()}`,
    );

    return this.mapApplication(rejectedApp);
  }

  private mapApplication(app: any): RegistrationApplication {
    return {
      id: app.id,
      userId: app.userId,
      applicantName: app.applicantName,
      applicantEmail: app.applicantEmail,
      institutionalId: app.institutionalId,
      department: app.department,
      contactNumber: app.contactNumber,
      requestedRole: app.requestedRole,
      status: app.status,
      emailVerified: app.emailVerified,
      tradeDiscipline: app.tradeDiscipline,
      certificationNumber: app.certificationNumber,
      yearsExperience: app.yearsExperience,
      facilityScope: app.facilityScope,
      appointmentJustification: app.appointmentJustification,
      rejectionReason: app.rejectionReason,
      reviewedById: app.reviewedById,
      reviewedAt: app.reviewedAt,
      submittedAt: app.submittedAt,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    };
  }
}
