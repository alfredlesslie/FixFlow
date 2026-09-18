import { Module } from '@nestjs/common';
import { HealthResolver } from './health.resolver';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
  providers: [HealthResolver],
})
export class HealthModule {}
