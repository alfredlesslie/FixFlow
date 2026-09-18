import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHealth() {
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
