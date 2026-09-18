import { Injectable, NotFoundException } from '@nestjs/common';
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

  async updateUserRole(id: string, role: Role): Promise<User> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role },
    });
    return this.mapUser(updated);
  }
}
