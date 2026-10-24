import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { MaintenanceSchedule } from './models/maintenance-schedule.model';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';

@Resolver(() => MaintenanceSchedule)
export class SchedulesResolver {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Query(() => [MaintenanceSchedule], {
    name: 'maintenanceSchedules',
    description: 'Retrieve institutional preventive maintenance schedules and upcoming due dates',
  })
  @UseGuards(GqlAuthGuard)
  async getMaintenanceSchedules(): Promise<MaintenanceSchedule[]> {
    return this.schedulesService.findAll();
  }
}
