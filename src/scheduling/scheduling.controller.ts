import { Body, Controller, Post } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { ScheduleRequestDto } from './dto';

@Controller('schedule')
export class SchedulingController {
  constructor(private svc: SchedulingService) {}

  @Post()
  build(@Body() dto: ScheduleRequestDto) {
    return this.svc.buildSchedule(dto.pods, dto.rounds);
  }
}
