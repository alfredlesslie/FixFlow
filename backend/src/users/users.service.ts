import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums';
import { User } from './models/user.model';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private mapUser(user: any): User {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName} ${user.lastName}`.trim(),
      role: user.role,
      status: user.status ?? 'PENDING_VERIFICATION',
      emailVerified: user.emailVerified ?? false,
      emailVerifiedAt: user.emailVerifiedAt ?? null,
      tokenVersion: user.tokenVersion ?? 0,
      institutionalId: user.institutionalId ?? null,
      department: user.department,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return this.mapUser(user);
  }

  async findByEmail(email: string): Promise<any> {
    // Returns full record including passwordHash for internal authentication
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findAll(role?: Role): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: role ? { role } : undefined,
      orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
    });
    return users.map((u) => this.mapUser(u));
  }

  async updateUserRole(id: string, role: Role, actorId?: string): Promise<User> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Safety constraint: prevent self-demotion or removal of last active administrator
    if (existing.role === Role.ADMIN && role !== Role.ADMIN) {
      if (existing.id === actorId) {
        throw new ForbiddenException('Administrators cannot demote their own account');
      }
      const adminCount = await this.prisma.user.count({
        where: { role: Role.ADMIN, isActive: true },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot demote the last remaining active administrator');
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id },
        data: {
          role,
          tokenVersion: { increment: 1 },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actorId || id,
          action: 'USER_ROLE_CHANGED',
          entity: 'USER',
          entityId: id,
          metadata: {
            previousRole: existing.role,
            newRole: role,
          },
        },
      });

      return u;
    });

    return this.mapUser(updated);
  }

  async updateUserActive(id: string, isActive: boolean, actorId?: string): Promise<User> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Safety constraint: prevent deactivating own admin account or last remaining admin
    if (existing.role === Role.ADMIN && !isActive) {
      if (existing.id === actorId) {
        throw new ForbiddenException('Administrators cannot deactivate their own account');
      }
      const adminCount = await this.prisma.user.count({
        where: { role: Role.ADMIN, isActive: true },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot deactivate the last remaining active administrator');
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id },
        data: {
          isActive,
          tokenVersion: { increment: 1 },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actorId || id,
          action: 'USER_STATUS_CHANGED',
          entity: 'USER',
          entityId: id,
          metadata: {
            previousActive: existing.isActive,
            newActive: isActive,
          },
        },
      });

      return u;
    });

    return this.mapUser(updated);
  }
}
