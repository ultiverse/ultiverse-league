import { Module } from '@nestjs/common';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { PodEngineAdapter } from './pod-engine/adapter.service';
import { PodSchedulerService } from './pod-engine/podscheduler.service';
import { POD_SCHEDULER } from './pod-engine/tokens';

@Module({
  controllers: [SchedulesController],
  providers: [
    { provide: POD_SCHEDULER, useClass: PodSchedulerService },
    PodEngineAdapter,
    SchedulesService,
  ],
  exports: [SchedulesService, PodEngineAdapter, POD_SCHEDULER],
})
export class SchedulesModule {}
