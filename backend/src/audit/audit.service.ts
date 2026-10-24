import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const SENSITIVE_KEY_PATTERNS = Object.freeze([
  /password/i,
  /token/i,
  /secret/i,
  /(?:^|[_-])auth(?:entication|orization)?(?:[_-]|$)|authHeader/i,
  /credential/i,
  /cookie/i,
  /hash/i,
  /(?:api|private|signing|client|access)[_-]?key/i,
  /bearer/i,
  /(?:^|[_-]|user|admin|auth|login|security)(?:otp|pin)(?:[_-]|code)?$/i,
]);

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recursively sanitizes metadata by redacting sensitive keys (passwords, tokens, secrets, hashes, API keys, OTPs, PINs).
   * Safe against non-POJO inputs (Date, Error, primitives, null/undefined).
   */
  static sanitizeMetadata(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }
    if (typeof obj !== 'object') {
      return obj;
    }
    if (obj instanceof Date) {
      return obj.toISOString();
    }
    if (obj instanceof Error) {
      return { name: obj.name, message: obj.message };
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => AuditService.sanitizeMetadata(item));
    }
    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      const isSensitive = SENSITIVE_KEY_PATTERNS.some((pat) => pat.test(key));
      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (val && typeof val === 'object') {
        sanitized[key] = AuditService.sanitizeMetadata(val);
      } else {
        sanitized[key] = val;
      }
    }
    return sanitized;
  }

  async logAction(
    actorId: string | null,
    action: string,
    entity: string,
    entityId: string,
    metadata?: Record<string, any>,
  ) {
    try {
      const sanitizedMeta = metadata ? AuditService.sanitizeMetadata(metadata) : {};
      const log = await this.prisma.auditLog.create({
        data: {
          actorId: actorId || null,
          action,
          entity,
          entityId,
          metadata: sanitizedMeta,
        },
      });
      this.logger.log(`Audit: [${action}] on ${entity} (${entityId}) by user: ${actorId || 'SYSTEM'}`);
      return log;
    } catch (err: any) {
      // Structured error logging without leaking raw metadata
      this.logger.error(
        `Failed to record audit log for action: [${action}] on ${entity} (${entityId})`,
        err?.stack,
      );
      // Non-blocking: audit failure should not crash primary operation
      return null;
    }
  }
}
