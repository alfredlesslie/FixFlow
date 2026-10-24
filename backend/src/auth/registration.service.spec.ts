import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { Role, AccountStatus, ApplicationStatus } from '../common/enums';

describe('RegistrationService', () => {
  let service: RegistrationService;
  let prisma: any;
  let mailService: any;
  let tokenService: any;
  let auditService: any;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      registrationApplication: {
        create: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(prisma);
      }),
    };

    mailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(true),
    };

    tokenService = {
      createVerificationToken: jest.fn().mockResolvedValue({
        rawToken: 'mock-raw-token',
        tokenHash: 'mock-hash',
        tokenMasked: 'mock-masked',
        expiresAt: new Date(Date.now() + 86400000),
      }),
      validateToken: jest.fn(),
      consumeToken: jest.fn().mockResolvedValue(true),
      validateAndConsumeToken: jest.fn(),
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue(true),
    };

    service = new RegistrationService(prisma, mailService, tokenService, auditService);
  });

  describe('registerRequester', () => {
    it('successfully registers requester and sends masked verification email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }) => ({
        id: 'u-req-1',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerifiedAt: null,
        tokenVersion: 0,
      }));

      const res = await service.registerRequester({
        email: 'riya@fixflow.edu',
        password: 'Password123',
        firstName: 'Riya',
        lastName: 'Sharma',
        department: 'CS',
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe(AccountStatus.PENDING_VERIFICATION);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'riya@fixflow.edu',
            role: Role.REQUESTER,
            status: AccountStatus.PENDING_VERIFICATION,
            emailVerified: false,
          }),
        }),
      );
      expect(tokenService.createVerificationToken).toHaveBeenCalledWith('u-req-1', 24, expect.anything());
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientEmail: 'riya@fixflow.edu',
          tokenMasked: 'mock-masked',
        }),
      );
    });

    it('returns enumeration-safe response without revealing existing account or throwing error', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'existing-id',
        email: 'existing@fixflow.edu',
        firstName: 'Existing',
        lastName: 'User',
        emailVerified: false,
      });

      const res = await service.registerRequester({
        email: 'existing@fixflow.edu',
        password: 'Password123',
        firstName: 'Existing',
        lastName: 'User',
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe(AccountStatus.PENDING_VERIFICATION);
      // Re-dispatches verification email to the real owner
      expect(mailService.sendVerificationEmail).toHaveBeenCalled();
    });
  });

  describe('registerStaff', () => {
    it('throws ForbiddenException if user attempts to register as ADMIN', async () => {
      await expect(
        service.registerStaff({
          email: 'admin.wannabe@fixflow.edu',
          password: 'Password123',
          firstName: 'Bad',
          lastName: 'Actor',
          requestedRole: Role.ADMIN,
          department: 'Administration',
          contactNumber: '1234567890',
          institutionalId: 'ADM-1',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('creates staff user in PENDING_VERIFICATION and application in PENDING_REVIEW', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }) => ({
        id: 'u-tech-1',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerifiedAt: null,
        tokenVersion: 0,
      }));
      prisma.registrationApplication.create.mockImplementation(({ data }) => ({
        id: 'app-tech-1',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const res = await service.registerStaff({
        email: 'rahul.tech@fixflow.edu',
        password: 'Password123',
        firstName: 'Rahul',
        lastName: 'Verma',
        requestedRole: Role.TECHNICIAN,
        department: 'HVAC Maintenance',
        contactNumber: '9876543210',
        institutionalId: 'TECH-101',
        tradeDiscipline: 'HVAC',
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe(AccountStatus.PENDING_VERIFICATION);
      expect(res.applicationId).toBe('app-tech-1');
      expect(prisma.registrationApplication.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'u-tech-1',
            requestedRole: Role.TECHNICIAN,
            status: ApplicationStatus.PENDING_REVIEW,
            emailVerified: false,
          }),
        }),
      );
    });
  });

  describe('verifyEmail', () => {
    it('transitions REQUESTER to ACTIVE upon successful atomic token consumption', async () => {
      tokenService.validateAndConsumeToken.mockResolvedValue({
        id: 'tok-1',
        userId: 'u-req-1',
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 'u-req-1',
        email: 'riya@fixflow.edu',
        firstName: 'Riya',
        lastName: 'Sharma',
        role: Role.REQUESTER,
        status: AccountStatus.PENDING_VERIFICATION,
        emailVerified: false,
        tokenVersion: 0,
        registrationApplications: [],
      });
      prisma.user.update.mockImplementation(({ data }) => ({
        id: 'u-req-1',
        email: 'riya@fixflow.edu',
        firstName: 'Riya',
        lastName: 'Sharma',
        role: Role.REQUESTER,
        status: data.status,
        emailVerified: data.emailVerified,
        emailVerifiedAt: data.emailVerifiedAt,
        tokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const res = await service.verifyEmail('valid-raw-token');
      expect(res.success).toBe(true);
      expect(res.status).toBe(AccountStatus.ACTIVE);
      expect(tokenService.validateAndConsumeToken).toHaveBeenCalledWith('valid-raw-token', expect.anything());
    });

    it('transitions TECHNICIAN to PENDING_APPROVAL upon atomic token consumption', async () => {
      tokenService.validateAndConsumeToken.mockResolvedValue({
        id: 'tok-2',
        userId: 'u-tech-1',
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 'u-tech-1',
        email: 'rahul@fixflow.edu',
        firstName: 'Rahul',
        lastName: 'Verma',
        role: Role.REQUESTER,
        status: AccountStatus.PENDING_VERIFICATION,
        emailVerified: false,
        tokenVersion: 0,
        registrationApplications: [
          {
            id: 'app-tech-1',
            requestedRole: Role.TECHNICIAN,
            status: ApplicationStatus.PENDING_REVIEW,
          },
        ],
      });
      prisma.user.update.mockImplementation(({ data }) => ({
        id: 'u-tech-1',
        email: 'rahul@fixflow.edu',
        firstName: 'Rahul',
        lastName: 'Verma',
        role: Role.REQUESTER,
        status: data.status,
        emailVerified: data.emailVerified,
        emailVerifiedAt: data.emailVerifiedAt,
        tokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const res = await service.verifyEmail('valid-raw-token');
      expect(res.success).toBe(true);
      expect(res.status).toBe(AccountStatus.PENDING_APPROVAL);
      expect(prisma.registrationApplication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'app-tech-1' },
          data: { emailVerified: true },
        }),
      );
    });
  });

  describe('reapply', () => {
    it('successfully submits reapplication for rejected applicant preserving previous history', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u-rejected-1',
        email: 'tech@fixflow.edu',
        firstName: 'Rahul',
        lastName: 'Verma',
        role: Role.REQUESTER,
        status: AccountStatus.REJECTED,
        emailVerified: true,
        tokenVersion: 1,
        registrationApplications: [
          {
            id: 'app-prev-1',
            requestedRole: Role.TECHNICIAN,
            status: ApplicationStatus.REJECTED,
            rejectionReason: 'Missing license',
          },
        ],
      });
      prisma.registrationApplication.create.mockResolvedValue({
        id: 'app-new-1',
        requestedRole: Role.TECHNICIAN,
        status: ApplicationStatus.PENDING_REVIEW,
      });
      prisma.user.update.mockResolvedValue({
        id: 'u-rejected-1',
        email: 'tech@fixflow.edu',
        firstName: 'Rahul',
        lastName: 'Verma',
        role: Role.REQUESTER,
        status: AccountStatus.PENDING_APPROVAL,
        emailVerified: true,
        tokenVersion: 1,
      });

      const res = await service.reapply('u-rejected-1', {
        requestedRole: Role.TECHNICIAN,
        department: 'HVAC',
        contactNumber: '9876543210',
        institutionalId: 'TECH-101',
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe(AccountStatus.PENDING_APPROVAL);
      expect(prisma.registrationApplication.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'u-rejected-1',
            requestedRole: Role.TECHNICIAN,
            status: ApplicationStatus.PENDING_REVIEW,
          }),
        }),
      );
    });

    it('rejects reapplication if role is not TECHNICIAN or FACILITY_MANAGER', async () => {
      await expect(
        service.reapply('u-rejected-1', {
          requestedRole: Role.REQUESTER,
          department: 'HVAC',
          contactNumber: '9876543210',
          institutionalId: 'TECH-101',
        }),
      ).rejects.toThrow('Requested role must be either TECHNICIAN or FACILITY_MANAGER');
    });
  });
});
