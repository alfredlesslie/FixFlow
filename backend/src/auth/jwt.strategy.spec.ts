import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../users/users.service';
import { Role, AccountStatus } from '../common/enums';
import { User } from '../users/models/user.model';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: Partial<UsersService>;
  let configService: ConfigService;

  const activeUser: User = {
    id: 'u-1',
    email: 'student@fixflow.edu',
    firstName: 'Riya',
    lastName: 'Sharma',
    name: 'Riya Sharma',
    role: Role.REQUESTER,
    status: AccountStatus.ACTIVE,
    emailVerified: true,
    tokenVersion: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'TestSuperSecretKeyForStrategyValidation123456';
        return null;
      }),
    } as unknown as ConfigService;

    usersService = {
      findById: jest.fn().mockImplementation(async (id: string) => {
        if (id === 'u-1') return activeUser;
        if (id === 'u-suspended') {
          return {
            ...activeUser,
            id: 'u-suspended',
            status: AccountStatus.SUSPENDED,
          };
        }
        if (id === 'u-inactive') {
          return {
            ...activeUser,
            id: 'u-inactive',
            isActive: false,
          };
        }
        return null;
      }),
    };

    strategy = new JwtStrategy(configService, usersService as UsersService);
  });

  it('validates and returns user when tokenVersion matches and account is ACTIVE', async () => {
    const user = await strategy.validate({
      sub: 'u-1',
      email: 'student@fixflow.edu',
      role: 'REQUESTER',
      tokenVersion: 2,
    });

    expect(user).toBeDefined();
    expect(user.id).toBe('u-1');
  });

  it('rejects JWT if tokenVersion does not match (session invalidated via role change/password reset)', async () => {
    await expect(
      strategy.validate({
        sub: 'u-1',
        email: 'student@fixflow.edu',
        role: 'REQUESTER',
        tokenVersion: 1, // Stale tokenVersion (current is 2)
      }),
    ).rejects.toThrow('Session has been revoked or invalidated; please log in again');
  });

  it('rejects JWT if user account status is not ACTIVE', async () => {
    await expect(
      strategy.validate({
        sub: 'u-suspended',
        email: 'suspended@fixflow.edu',
        role: 'REQUESTER',
        tokenVersion: 2,
      }),
    ).rejects.toThrow('User account is not currently in an authorized status');
  });

  it('rejects JWT if tokenVersion is missing or not a number', async () => {
    await expect(
      strategy.validate({
        sub: 'u-1',
        email: 'student@fixflow.edu',
        role: 'REQUESTER',
        tokenVersion: undefined as any,
      }),
    ).rejects.toThrow('Session has been revoked or invalidated; please log in again');

    await expect(
      strategy.validate({
        sub: 'u-1',
        email: 'student@fixflow.edu',
        role: 'REQUESTER',
        tokenVersion: 'invalid-string' as any,
      }),
    ).rejects.toThrow('Session has been revoked or invalidated; please log in again');
  });

  it('allows REJECTED user to pass JwtStrategy for restricted reapplication flow', async () => {
    (usersService.findById as jest.Mock).mockResolvedValueOnce({
      ...activeUser,
      id: 'u-rejected',
      status: AccountStatus.REJECTED,
    });

    const user = await strategy.validate({
      sub: 'u-rejected',
      email: 'student@fixflow.edu',
      role: 'REQUESTER',
      tokenVersion: 2,
    });

    expect(user).toBeDefined();
    expect(user.status).toBe(AccountStatus.REJECTED);
  });

  it('rejects JWT if user account isActive is false', async () => {
    await expect(
      strategy.validate({
        sub: 'u-inactive',
        email: 'inactive@fixflow.edu',
        role: 'REQUESTER',
        tokenVersion: 2,
      }),
    ).rejects.toThrow('Session expired or user account is no longer active');
  });
});
