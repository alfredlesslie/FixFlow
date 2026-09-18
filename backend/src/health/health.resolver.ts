import { Resolver, Query } from '@nestjs/graphql';
import { HealthCheckPayload } from './health.model';
import { PrismaService } from '../prisma/prisma.service';

@Resolver()
export class HealthResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => HealthCheckPayload, {
    name: 'healthCheck',
    description: 'System health check and database connectivity verification',
  })
  async healthCheck(): Promise<HealthCheckPayload> {
    const isDbAlive = await this.prisma.checkHealth();
    return {
      status: isDbAlive ? 'ok' : 'degraded',
      service: 'FixFlow API Service',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: isDbAlive ? 'connected' : 'disconnected',
    };
  }
}
