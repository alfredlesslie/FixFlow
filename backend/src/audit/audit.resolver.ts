import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLog } from './models/audit-log.model';
import { Role } from '../common/enums';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Resolver(() => AuditLog)
export class AuditResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => [AuditLog], {
    name: 'auditLogs',
    description: 'Retrieve system security and operational audit logs (Admin only)',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAuditLogs(
    @Args('entity', { type: () => String, nullable: true }) entity?: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 }) limit?: number,
  ): Promise<AuditLog[]> {
    const safeLimit = Math.min(Math.max(1, limit ?? 50), 100);
    const logs = await this.prisma.auditLog.findMany({
      where: entity ? { entity } : undefined,
      take: safeLimit,
      orderBy: { timestamp: 'desc' },
    });

    return logs.map((l) => ({
      id: l.id,
      actorId: l.actorId,
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      metadata: l.metadata ? JSON.stringify(l.metadata) : null,
      timestamp: l.timestamp,
    }));
  }
}
