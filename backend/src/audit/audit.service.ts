import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logAction(
    actorId: string | null,
    action: string,
    entity: string,
    entityId: string,
    metadata?: Record<string, any>,
  ) {
    try {
      const log = await this.prisma.auditLog.create({
        data: {
          actorId: actorId || null,
          action,
          entity,
          entityId,
          metadata: metadata || {},
        },
      });
      this.logger.log(`Audit: [${action}] on ${entity} (${entityId}) by user: ${actorId || 'SYSTEM'}`);
      return log;
    } catch (err) {
      this.logger.error(`Failed to record audit log for action: ${action}`, err.stack);
      // Non-blocking: audit failure should not crash primary operation
      return null;
    }
  }
}
