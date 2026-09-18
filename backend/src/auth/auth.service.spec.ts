import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { Role } from '../common/enums';

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
            isActive: false,
          };
        }
        return null;
      }),
      findById: jest.fn().mockImplementation(async (id: string) => {
        if (id === 'user-mgr-1') {
          return {
            id: 'user-mgr-1',
            email: 'manager@fixflow.edu',
            firstName: 'Sunil',
            lastName: 'Mehta',
            name: 'Sunil Mehta',
            role: Role.FACILITY_MANAGER,
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

  it('should reject login with incorrect password', async () => {
    await expect(
      authService.login({
        email: 'manager@fixflow.edu',
        password: 'IncorrectPassword',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject login for unknown user email', async () => {
    await expect(
      authService.login({
        email: 'unknown@fixflow.edu',
        password: mockPassword,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject login for deactivated user account', async () => {
    await expect(
      authService.login({
        email: 'inactive@fixflow.edu',
        password: mockPassword,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
