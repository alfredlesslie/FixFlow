import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { RegistrationService } from './registration.service';
import { AdministratorApprovalsService } from './administrator-approvals.service';
import { Role, AccountStatus, ApplicationStatus } from '../common/enums';
import { User } from '../users/models/user.model';

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let authService: Partial<AuthService>;
  let registrationService: Partial<RegistrationService>;
  let adminService: Partial<AdministratorApprovalsService>;

  const mockUser: User = {
    id: 'u-1',
    email: 'user@fixflow.edu',
    firstName: 'Test',
    lastName: 'User',
    name: 'Test User',
    role: Role.REQUESTER,
    status: AccountStatus.ACTIVE,
    emailVerified: true,
    tokenVersion: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdmin: User = {
    ...mockUser,
    id: 'u-admin',
    role: Role.ADMIN,
  };

  beforeEach(() => {
    authService = {
      login: jest.fn().mockResolvedValue({
        accessToken: 'mock-jwt-token',
        user: mockUser,
      }),
    };

    registrationService = {
      registerRequester: jest.fn().mockResolvedValue({
        success: true,
        message: 'Registered',
        status: AccountStatus.PENDING_VERIFICATION,
        user: mockUser,
      }),
      registerStaff: jest.fn().mockResolvedValue({
        success: true,
        message: 'Staff registered',
        status: AccountStatus.PENDING_VERIFICATION,
        user: mockUser,
        applicationId: 'app-1',
      }),
      verifyEmail: jest.fn().mockResolvedValue({
        success: true,
        message: 'Verified',
        status: AccountStatus.ACTIVE,
        user: mockUser,
      }),
      resendVerificationEmail: jest.fn().mockResolvedValue({
        success: true,
        message: 'Dispatched',
      }),
      reapply: jest.fn().mockResolvedValue({
        success: true,
        message: 'Reapplied',
        status: AccountStatus.PENDING_APPROVAL,
      }),
    };

    adminService = {
      getApplications: jest.fn().mockResolvedValue([]),
      getApplicationById: jest.fn().mockResolvedValue({ id: 'app-1' } as any),
      approveApplication: jest.fn().mockResolvedValue({ id: 'app-1', status: ApplicationStatus.APPROVED } as any),
      rejectApplication: jest.fn().mockResolvedValue({ id: 'app-1', status: ApplicationStatus.REJECTED } as any),
    };

    const mailService = {
      getDevLatestToken: jest.fn().mockReturnValue('mock-raw-token-123'),
    };

    resolver = new AuthResolver(
      authService as AuthService,
      registrationService as RegistrationService,
      adminService as AdministratorApprovalsService,
      mailService as any,
    );
  });

  it('delegates login to authService', async () => {
    const res = await resolver.login({ email: 'user@fixflow.edu', password: 'password' });
    expect(res.accessToken).toBe('mock-jwt-token');
    expect(authService.login).toHaveBeenCalledWith({ email: 'user@fixflow.edu', password: 'password' });
  });

  it('delegates registerRequester to registrationService', async () => {
    const input = {
      email: 'user@fixflow.edu',
      password: 'password',
      firstName: 'Test',
      lastName: 'User',
    };
    const res = await resolver.registerRequester(input);
    expect(res.success).toBe(true);
    expect(registrationService.registerRequester).toHaveBeenCalledWith(input);
  });

  it('delegates registerStaff to registrationService', async () => {
    const input = {
      email: 'tech@fixflow.edu',
      password: 'password',
      firstName: 'Tech',
      lastName: 'User',
      requestedRole: Role.TECHNICIAN,
      department: 'HVAC',
      contactNumber: '1234567890',
      institutionalId: 'TECH-1',
    };
    const res = await resolver.registerStaff(input);
    expect(res.success).toBe(true);
    expect(registrationService.registerStaff).toHaveBeenCalledWith(input);
  });

  it('delegates verifyEmail to registrationService', async () => {
    const res = await resolver.verifyEmail({ token: 'mock-token' });
    expect(res.success).toBe(true);
    expect(registrationService.verifyEmail).toHaveBeenCalledWith('mock-token');
  });

  it('delegates resendVerificationEmail to registrationService', async () => {
    const res = await resolver.resendVerificationEmail({ email: 'user@fixflow.edu' });
    expect(res.success).toBe(true);
    expect(registrationService.resendVerificationEmail).toHaveBeenCalledWith('user@fixflow.edu');
  });

  it('delegates reapplyRegistration to registrationService with currentUser id', async () => {
    const input = {
      requestedRole: Role.TECHNICIAN,
      department: 'HVAC',
      contactNumber: '1234567890',
      institutionalId: 'TECH-1',
    };
    const res = await resolver.reapplyRegistration(input, mockUser);
    expect(res.success).toBe(true);
    expect(registrationService.reapply).toHaveBeenCalledWith('u-1', input);
  });

  it('delegates approveRegistrationApplication to administratorApprovalsService', async () => {
    const res = await resolver.approveRegistrationApplication('app-1', mockAdmin);
    expect(res.status).toBe(ApplicationStatus.APPROVED);
    expect(adminService.approveApplication).toHaveBeenCalledWith('app-1', mockAdmin);
  });

  it('delegates rejectRegistrationApplication to administratorApprovalsService', async () => {
    const res = await resolver.rejectRegistrationApplication('app-1', 'Insufficient proof', mockAdmin);
    expect(res.status).toBe(ApplicationStatus.REJECTED);
    expect(adminService.rejectApplication).toHaveBeenCalledWith('app-1', 'Insufficient proof', mockAdmin);
  });

  it('delegates devLatestVerificationToken to mailService', async () => {
    const token = await resolver.devLatestVerificationToken('student@fixflow.edu');
    expect(token).toBe('mock-raw-token-123');
  });
});
