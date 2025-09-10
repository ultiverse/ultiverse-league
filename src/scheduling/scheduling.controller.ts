import { Body, Controller, Post } from '@nestjs/common';
import { FixturesService } from '../fixtures/fixtures.service';
import { PodSchedulerService } from './pod-scheduler.service';
import {
  PodScheduleByIdsDto,
  PodScheduleByLeagueDto,
  ScheduleRequestDto,
} from './dto';

@Controller('schedule')
export class SchedulingController {
  constructor(
    private readonly podScheduler: PodSchedulerService,
    private readonly fixtures: FixturesService,
  ) {}

  // existing generic schedule (if you kept it)
  @Post()
  buildGeneric(@Body() dto: ScheduleRequestDto) {
    return this.podScheduler.build({
      pods: dto.pods,
      rounds: dto.rounds,
      recencyWindow: dto.recencyWindow,
      skill: dto.skill,
      history: dto.history,
      pairingMode: dto.pairingMode ?? 'each-vs-both',
    });
  }

  // 🆕 Build pod schedule from explicit pod IDs
  @Post('pods')
  buildPods(@Body() dto: PodScheduleByIdsDto) {
    return this.podScheduler.build({
      pods: dto.podIds,
      rounds: dto.rounds,
      recencyWindow: dto.recencyWindow,
      skill: dto.skill,
      history: dto.history,
      pairingMode: dto.pairingMode ?? 'each-vs-both',
    });
  }

  // 🆕 Build pod schedule by league (pods auto-fetched)
  @Post('pods/by-league')
  buildPodsByLeague(@Body() dto: PodScheduleByLeagueDto) {
    const pods = this.fixtures.getTeams(dto.leagueId, 'pod').map((t) => t.id);
    return this.podScheduler.build({
      pods,
      rounds: dto.rounds,
      recencyWindow: dto.recencyWindow,
      skill: dto.skill,
      history: dto.history,
      pairingMode: dto.pairingMode ?? 'each-vs-both',
    });
  }
}
