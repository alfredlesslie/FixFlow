import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { Role, AccountStatus } from '../common/enums';
import { User } from './models/user.model';
import { ROLES_KEY } from '../common/decorators/roles.decorator';

describe('UsersResolver Ownership and Access Control Suite', () => {
  let resolver: UsersResolver;
  let mockUsersService: Partial<UsersService>;

  const ordinaryRequester: User = {
    id: 'user-requester-1',
    email: 'student@fixflow.edu',
    firstName: 'Riya',
    lastName: 'Sharma',
    name: 'Riya Sharma',
    role: Role.REQUESTER,
    status: AccountStatus.ACTIVE,
    emailVerified: true,
    tokenVersion: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const otherRequester: User = {
    id: 'user-requester-2',
    email: 'other.student@fixflow.edu',
    firstName: 'Karan',
    lastName: 'Joshi',
    name: 'Karan Joshi',
    role: Role.REQUESTER,
    status: AccountStatus.ACTIVE,
    emailVerified: true,
    tokenVersion: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const adminUser: User = {
    ...ordinaryRequester,
    id: 'user-admin-1',
    email: 'admin@fixflow.edu',
    role: Role.ADMIN,
  };

  const facilityManagerUser: User = {
    ...ordinaryRequester,
    id: 'user-fm-1',
    email: 'fm@fixflow.edu',
    role: Role.FACILITY_MANAGER,
  };

  beforeEach(() => {
    mockUsersService = {
      findById: jest.fn().mockImplementation(async (id: string) => {
        if (id === ordinaryRequester.id) return ordinaryRequester;
        if (id === otherRequester.id) return otherRequester;
        return null;
      }),
      findAll: jest.fn().mockResolvedValue([ordinaryRequester, otherRequester]),
    };

    resolver = new UsersResolver(mockUsersService as UsersService);
  });

  describe('UsersResolver.getUser (Ownership Enforcement)', () => {
    it('allows a user to retrieve their own profile', async () => {
      const result = await resolver.getUser(ordinaryRequester.id, ordinaryRequester);
      expect(result).toBeDefined();
      expect(result.id).toBe(ordinaryRequester.id);
      expect(mockUsersService.findById).toHaveBeenCalledWith(ordinaryRequester.id);
    });

    it('rejects an ordinary user attempting to view another user profile with ForbiddenException', async () => {
      await expect(
        resolver.getUser(otherRequester.id, ordinaryRequester),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        resolver.getUser(otherRequester.id, ordinaryRequester),
      ).rejects.toThrow('You are not authorized to view another user profile');

      expect(mockUsersService.findById).not.toHaveBeenCalled();
    });

    it('allows an ADMIN user to view any user profile', async () => {
      const result = await resolver.getUser(otherRequester.id, adminUser);
      expect(result).toBeDefined();
      expect(result.id).toBe(otherRequester.id);
      expect(mockUsersService.findById).toHaveBeenCalledWith(otherRequester.id);
    });

    it('allows a FACILITY_MANAGER user to view any user profile', async () => {
      const result = await resolver.getUser(otherRequester.id, facilityManagerUser);
      expect(result).toBeDefined();
      expect(result.id).toBe(otherRequester.id);
      expect(mockUsersService.findById).toHaveBeenCalledWith(otherRequester.id);
    });

    it('throws NotFoundException when an authorized admin requests a non-existent user ID', async () => {
      await expect(
        resolver.getUser('non-existent-user-id', adminUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('UsersResolver.getUsers (Role Authorization)', () => {
    it('requires Role.ADMIN and Role.FACILITY_MANAGER metadata on getUsers query', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, UsersResolver.prototype.getUsers);
      expect(roles).toEqual([Role.ADMIN, Role.FACILITY_MANAGER]);
    });

    it('calls usersService.findAll with optional role filter', async () => {
      const result = await resolver.getUsers(Role.REQUESTER);
      expect(result).toHaveLength(2);
      expect(mockUsersService.findAll).toHaveBeenCalledWith(Role.REQUESTER);
    });
  });
});
