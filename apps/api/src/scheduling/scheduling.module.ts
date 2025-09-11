import { Module } from '@nestjs/common';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';
import { PodSchedulerService } from './pod-scheduler.service';
import { MatchingService } from './matching.service';
import { CostService } from './cost.service';
import { FixturesService } from 'src/fixtures/fixtures.service';
import { UCService } from 'src/integrations/uc.service';

@Module({
  controllers: [SchedulingController],
  providers: [
    SchedulingService,
    PodSchedulerService,
    MatchingService,
    CostService,
    FixturesService,
    UCService,
  ],
})
export class SchedulingModule {}
