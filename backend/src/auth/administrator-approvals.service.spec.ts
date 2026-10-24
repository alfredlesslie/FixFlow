import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdministratorApprovalsService } from './administrator-approvals.service';
import { Role, AccountStatus, ApplicationStatus } from '../common/enums';
import { User } from '../users/models/user.model';

describe('AdministratorApprovalsService', () => {
  let service: AdministratorApprovalsService;
  let prisma: any;

  const mockAdmin: User = {
    id: 'u-admin-1',
    email: 'admin@fixflow.edu',
    firstName: 'Vikram',
    lastName: 'Singhania',
    name: 'Vikram Singhania',
    role: Role.ADMIN,
    status: AccountStatus.ACTIVE,
    emailVerified: false,
    tokenVersion: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockNonAdmin: User = {
    ...mockAdmin,
    id: 'u-tech-1',
    role: Role.TECHNICIAN,
  };

  beforeEach(() => {
    prisma = {
      registrationApplication: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(prisma);
      }),
    };

    service = new AdministratorApprovalsService(prisma);
  });

  describe('approveApplication', () => {
    const mockApp = {
      id: 'app-1',
      userId: 'u-applicant-1',
      applicantName: 'Rahul Verma',
      applicantEmail: 'rahul@fixflow.edu',
      institutionalId: 'TECH-101',
      department: 'HVAC',
      contactNumber: '9876543210',
      requestedRole: Role.TECHNICIAN,
      status: ApplicationStatus.PENDING_REVIEW,
      emailVerified: true,
      user: {
        id: 'u-applicant-1',
        emailVerified: true,
        status: AccountStatus.PENDING_APPROVAL,
      },
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('successfully approves application, promotes user to requested role, and increments tokenVersion', async () => {
      prisma.registrationApplication.findUnique.mockResolvedValue(mockApp);
      prisma.registrationApplication.update.mockResolvedValue({
        ...mockApp,
        status: ApplicationStatus.APPROVED,
        reviewedById: mockAdmin.id,
        reviewedAt: new Date(),
      });
      prisma.user.update.mockResolvedValue({ id: 'u-applicant-1' });

      const result = await service.approveApplication('app-1', mockAdmin);

      expect(result.status).toBe(ApplicationStatus.APPROVED);
      expect(prisma.registrationApplication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'app-1' },
          data: expect.objectContaining({ status: ApplicationStatus.APPROVED }),
        }),
      );
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u-applicant-1' },
          data: expect.objectContaining({
            status: AccountStatus.ACTIVE,
            role: Role.TECHNICIAN,
            tokenVersion: { increment: 1 },
          }),
        }),
      );
    });

    it('rejects approval if applicant email is unverified', async () => {
      prisma.registrationApplication.findUnique.mockResolvedValue({
        ...mockApp,
        emailVerified: false,
        user: {
          id: 'u-applicant-1',
          emailVerified: false,
          status: AccountStatus.PENDING_VERIFICATION,
        },
      });

      await expect(service.approveApplication('app-1', mockAdmin)).rejects.toThrow(
        'Cannot approve staff application: Applicant institutional email address has not been verified',
      );
    });

    it('strictly prevents self-approval by an applicant who has admin privileges', async () => {
      prisma.registrationApplication.findUnique.mockResolvedValue({
        ...mockApp,
        userId: mockAdmin.id, // Self-application!
      });

      await expect(service.approveApplication('app-1', mockAdmin)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rejects approval attempts by non-administrators', async () => {
      await expect(service.approveApplication('app-1', mockNonAdmin)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rejects approval if application has already been reviewed', async () => {
      prisma.registrationApplication.findUnique.mockResolvedValue({
        ...mockApp,
        status: ApplicationStatus.APPROVED,
      });

      await expect(service.approveApplication('app-1', mockAdmin)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('rejectApplication', () => {
    const mockApp = {
      id: 'app-2',
      userId: 'u-applicant-2',
      requestedRole: Role.FACILITY_MANAGER,
      status: ApplicationStatus.PENDING_REVIEW,
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('successfully rejects application with documented reason and sets user status to REJECTED', async () => {
      prisma.registrationApplication.findUnique.mockResolvedValue(mockApp);
      prisma.registrationApplication.update.mockResolvedValue({
        ...mockApp,
        status: ApplicationStatus.REJECTED,
        rejectionReason: 'Invalid certification credentials',
        reviewedById: mockAdmin.id,
        reviewedAt: new Date(),
      });

      const result = await service.rejectApplication(
        'app-2',
        'Invalid certification credentials',
        mockAdmin,
      );

      expect(result.status).toBe(ApplicationStatus.REJECTED);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u-applicant-2' },
          data: expect.objectContaining({
            status: AccountStatus.REJECTED,
            tokenVersion: { increment: 1 },
          }),
        }),
      );
    });

    it('throws BadRequestException if rejection reason is missing or empty', async () => {
      await expect(service.rejectApplication('app-2', '', mockAdmin)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.rejectApplication('app-2', '   ', mockAdmin)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
