import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MaintenanceSchedule } from './models/maintenance-schedule.model';

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieve all preventive maintenance schedules with linked equipment asset details.
   */
  async findAll(): Promise<MaintenanceSchedule[]> {
    const schedules = await this.prisma.maintenanceSchedule.findMany({
      include: {
        asset: {
          include: {
            category: true,
            location: true,
          },
        },
      },
      orderBy: { nextDueDate: 'asc' },
    });

    return schedules as unknown as MaintenanceSchedule[];
  }
}
