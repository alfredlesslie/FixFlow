import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { Role, AccountStatus } from '../common/enums';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<UsersService>;
  let jwtService: Partial<JwtService>;
  let auditService: Partial<AuditService>;

  const mockPassword = 'SecretPassword123';
  let hashedPassword: string;

  beforeAll(async () => {
    hashedPassword = await bcrypt.hash(mockPassword, 10);
  });

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn().mockImplementation(async (email: string) => {
        if (email === 'manager@fixflow.edu') {
          return {
            id: 'user-mgr-1',
            email: 'manager@fixflow.edu',
            passwordHash: hashedPassword,
            firstName: 'Sunil',
            lastName: 'Mehta',
            role: Role.FACILITY_MANAGER,
            status: AccountStatus.ACTIVE,
            tokenVersion: 0,
            isActive: true,
          };
        }
        if (email === 'unverified@fixflow.edu') {
          return {
            id: 'user-unver-1',
            email: 'unverified@fixflow.edu',
            passwordHash: hashedPassword,
            firstName: 'New',
            lastName: 'User',
            role: Role.REQUESTER,
            status: AccountStatus.PENDING_VERIFICATION,
            tokenVersion: 0,
            isActive: true,
          };
        }
        if (email === 'suspended@fixflow.edu') {
          return {
            id: 'user-susp-1',
            email: 'suspended@fixflow.edu',
            passwordHash: hashedPassword,
            firstName: 'Suspended',
            lastName: 'User',
            role: Role.REQUESTER,
            status: AccountStatus.SUSPENDED,
            tokenVersion: 0,
            isActive: true,
          };
        }
        if (email === 'rejected@fixflow.edu') {
          return {
            id: 'user-rej-1',
            email: 'rejected@fixflow.edu',
            passwordHash: hashedPassword,
            firstName: 'Rejected',
            lastName: 'Applicant',
            role: Role.REQUESTER,
            status: AccountStatus.REJECTED,
            tokenVersion: 0,
            isActive: true,
          };
        }
        if (email === 'inactive@fixflow.edu') {
          return {
            id: 'user-inact-1',
            email: 'inactive@fixflow.edu',
            passwordHash: hashedPassword,
            firstName: 'Inactive',
            lastName: 'User',
            role: Role.REQUESTER,
            status: AccountStatus.ACTIVE,
            isActive: false,
          };
        }
        return null;
      }),
      findById: jest.fn().mockImplementation(async (id: string) => {
        if (id === 'user-rej-1') {
          return {
            id: 'user-rej-1',
            email: 'rejected@fixflow.edu',
            firstName: 'Rejected',
            lastName: 'Applicant',
            name: 'Rejected Applicant',
            role: Role.REQUESTER,
            status: AccountStatus.REJECTED,
            tokenVersion: 0,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
        if (id === 'user-mgr-1') {
          return {
            id: 'user-mgr-1',
            email: 'manager@fixflow.edu',
            firstName: 'Sunil',
            lastName: 'Mehta',
            name: 'Sunil Mehta',
            role: Role.FACILITY_MANAGER,
            status: AccountStatus.ACTIVE,
            tokenVersion: 0,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
        return null;
      }),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token-string'),
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'audit-1' } as any),
    };

    authService = new AuthService(
      usersService as UsersService,
      jwtService as JwtService,
      auditService as AuditService,
    );
  });

  it('should validate and log in an existing user with valid credentials', async () => {
    const result = await authService.login({
      email: 'manager@fixflow.edu',
      password: mockPassword,
    });

    expect(result).toBeDefined();
    expect(result.accessToken).toBe('mock-jwt-token-string');
    expect(result.user.email).toBe('manager@fixflow.edu');
    expect(result.user.role).toBe(Role.FACILITY_MANAGER);
    expect(auditService.logAction).toHaveBeenCalledWith(
      'user-mgr-1',
      'USER_LOGIN',
      'USER',
      'user-mgr-1',
      expect.any(Object),
    );
  });

  it('should reject login with incorrect password and uniform message', async () => {
    await expect(
      authService.login({
        email: 'manager@fixflow.edu',
        password: 'IncorrectPassword',
      }),
    ).rejects.toThrow('Invalid email or password credentials');
  });

  it('should reject login for unknown user email with uniform message', async () => {
    await expect(
      authService.login({
        email: 'unknown@fixflow.edu',
        password: mockPassword,
      }),
    ).rejects.toThrow('Invalid email or password credentials');
  });

  it('should reject login for deactivated user account with uniform message and audit record', async () => {
    await expect(
      authService.login({
        email: 'inactive@fixflow.edu',
        password: mockPassword,
      }),
    ).rejects.toThrow('Invalid email or password credentials');

    expect(auditService.logAction).toHaveBeenCalledWith(
      'user-inact-1',
      'USER_LOGIN_FAILED_DEACTIVATED',
      'USER',
      'user-inact-1',
      expect.objectContaining({ email: 'inactive@fixflow.edu' }),
    );
  });

  it('should reject login for unverified account with explicit instructional message', async () => {
    await expect(
      authService.login({
        email: 'unverified@fixflow.edu',
        password: mockPassword,
      }),
    ).rejects.toThrow('Please verify your institutional email address before logging in');

    expect(auditService.logAction).toHaveBeenCalledWith(
      'user-unver-1',
      'USER_LOGIN_BLOCKED_UNVERIFIED',
      'USER',
      'user-unver-1',
      expect.objectContaining({ email: 'unverified@fixflow.edu' }),
    );
  });

  it('should reject login for suspended account with contact instructions', async () => {
    await expect(
      authService.login({
        email: 'suspended@fixflow.edu',
        password: mockPassword,
      }),
    ).rejects.toThrow('Account has been suspended. Please contact institutional administration.');

    expect(auditService.logAction).toHaveBeenCalledWith(
      'user-susp-1',
      'USER_LOGIN_BLOCKED_SUSPENDED',
      'USER',
      'user-susp-1',
      expect.objectContaining({ email: 'suspended@fixflow.edu' }),
    );
  });

  it('should embed tokenVersion in JWT payload upon login', async () => {
    await authService.login({
      email: 'manager@fixflow.edu',
      password: mockPassword,
    });

    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: 'user-mgr-1',
        tokenVersion: 0,
      }),
    );
  });

  it('should permit rejected account to authenticate with restricted audit record for reapplication', async () => {
    const result = await authService.login({
      email: 'rejected@fixflow.edu',
      password: mockPassword,
    });

    expect(result).toBeDefined();
    expect(result.user.status).toBe(AccountStatus.REJECTED);
    expect(auditService.logAction).toHaveBeenCalledWith(
      'user-rej-1',
      'USER_LOGIN_REJECTED_ACCOUNT',
      'USER',
      'user-rej-1',
      expect.objectContaining({ status: AccountStatus.REJECTED }),
    );
  });
});
