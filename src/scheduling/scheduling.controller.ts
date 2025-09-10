import { Body, Controller, Post } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { ScheduleRequestDto } from './dto';
import { PodSchedulerService } from './pod-scheduler.service';

@Controller('schedule')
export class SchedulingController {
  constructor(
    private svc: SchedulingService,
    private podScheduler: PodSchedulerService,
  ) {}

  @Post()
  build(@Body() dto: ScheduleRequestDto) {
    return this.svc.buildSchedule(dto.pods, dto.rounds);
  }

  @Post('real')
  buildReal(@Body() dto: ScheduleRequestDto) {
    return this.podScheduler.build({
      pods: dto.pods,
      rounds: dto.rounds,
      recencyWindow: dto.recencyWindow,
      skill: dto.skill,
      history: dto.history,
      pairingMode: dto.pairingMode ?? 'each-vs-both',
    });
  }
}
