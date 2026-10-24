import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SchedulesResolver } from './schedules.resolver';

@Module({
  providers: [SchedulesService, SchedulesResolver],
  exports: [SchedulesService],
})
export class SchedulesModule {}
