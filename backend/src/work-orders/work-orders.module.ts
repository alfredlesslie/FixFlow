import { Module } from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';
import { WorkOrdersResolver } from './work-orders.resolver';

@Module({
  providers: [WorkOrdersService, WorkOrdersResolver],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
