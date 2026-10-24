import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

export const RATE_LIMIT_KEY = 'rate_limit';
export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options);

interface HitRecord {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly hits = new Map<string, HitRecord>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.get<RateLimitOptions>(RATE_LIMIT_KEY, context.getHandler());
    if (!options) {
      return true; // No rate limit configured for handler
    }

    const gqlContext = GqlExecutionContext.create(context);
    const req = gqlContext.getContext()?.req || context.switchToHttp().getRequest();

    // Safe client IP resolution:
    // Relies on Express-validated req.ip or socket remote address.
    // Client-supplied forwarding headers are never trusted directly without adapter proxy trust.
    const clientIp = req?.ip || req?.socket?.remoteAddress || 'anonymous-client';

    const handlerName = context.getHandler().name;
    const key = `${clientIp}:${handlerName}`;
    const now = Date.now();

    // Prevent unbounded memory growth: periodically prune expired records
    if (this.hits.size > 200) {
      this.cleanupExpired(now);
    }

    const record = this.hits.get(key);

    if (!record || now > record.resetAt) {
      this.hits.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      return true;
    }

    const maxLimit = process.env.NODE_ENV === 'development' ? Math.max(options.max, 100) : options.max;
    if (record.count >= maxLimit) {
      const waitSeconds = Math.ceil((record.resetAt - now) / 1000);
      throw new HttpException(
        options.message || `Rate limit exceeded. Please retry in ${waitSeconds} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    record.count += 1;
    return true;
  }

  /**
   * Prunes expired records to prevent unbounded memory growth.
   * Architectural Note: In-memory rate limits are isolated to the single Node.js process replica.
   * Multi-instance or Kubernetes deployments should back this guard with a distributed cache (e.g. Redis).
   */
  cleanupExpired(now = Date.now()): void {
    for (const [key, record] of this.hits.entries()) {
      if (now > record.resetAt) {
        this.hits.delete(key);
      }
    }
  }

  /**
   * For testing: clear in-memory rate limit hits
   */
  clear(): void {
    this.hits.clear();
  }
}
