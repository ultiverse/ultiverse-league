import { Body, Controller, Post } from '@nestjs/common';
import { FixturesService } from '../fixtures/fixtures.service';
import { PodSchedulerService } from './pod-scheduler.service';
import {
  PodScheduleByIdsDto,
  PodScheduleByLeagueDto,
  ScheduleRequestDto,
} from './dto';
import { FieldAllocator } from './field-allocator.util';
import {
  type ScheduleView,
  type ScheduleGameView,
  type RoundView,
  type ScheduleOutput,
} from './types';

@Controller('schedule')
export class SchedulingController {
  private readonly allocator: FieldAllocator;

  constructor(
    private readonly podScheduler: PodSchedulerService,
    private readonly fixtures: FixturesService,
  ) {
    this.allocator = new FieldAllocator(fixtures);
  }

  @Post()
  buildGeneric(@Body() dto: ScheduleRequestDto): ScheduleView {
    const raw: ScheduleOutput = this.podScheduler.build({
      pods: dto.pods,
      rounds: dto.rounds,
      recencyWindow: dto.recencyWindow,
      skill: dto.skill,
      history: dto.history,
      pairingMode: dto.pairingMode ?? 'each-vs-both',
    });
    return this.mapBlocksToView(raw, undefined);
  }

  @Post('pods')
  buildPods(@Body() dto: PodScheduleByIdsDto): ScheduleView {
    const raw: ScheduleOutput = this.podScheduler.build({
      pods: dto.podIds,
      rounds: dto.rounds,
      recencyWindow: dto.recencyWindow,
      skill: dto.skill,
      history: dto.history,
      pairingMode: dto.pairingMode ?? 'each-vs-both',
    });
    return this.mapBlocksToView(raw, undefined);
  }

  @Post('pods/by-league')
  buildPodsByLeague(@Body() dto: PodScheduleByLeagueDto): ScheduleView {
    const pods = this.fixtures.getTeams(dto.leagueId, 'pod').map((t) => t.id);
    const raw: ScheduleOutput = this.podScheduler.build({
      pods,
      rounds: dto.rounds,
      recencyWindow: dto.recencyWindow,
      skill: dto.skill,
      history: dto.history,
      pairingMode: dto.pairingMode ?? 'each-vs-both',
    });
    return this.mapBlocksToView(raw, dto.leagueId);
  }

  // ---- helper (typed) ----
  private mapBlocksToView(
    raw: ScheduleOutput,
    leagueId?: string,
  ): ScheduleView {
    const rounds: RoundView[] = raw.rounds.map((r, idx) => {
      const slots = this.allocator.allocate(r.blocks.length, {
        leagueId,
        roundIndex: idx,
        startBaseISO: '2025-06-01T22:00:00Z',
        durationMins: 60,
      });

      // Build a quick id->name map for pod display names
      const podNameById: Record<string, string> = {};
      for (const t of this.fixtures.getTeams(leagueId, 'pod')) {
        podNameById[t.id] = t.name;
      }
      const name = (id: string) => podNameById[id] ?? id;

      const games: ScheduleGameView[] = r.blocks.map((blk, i) => {
        const slot = slots[i];
        return {
          gameId: `R${r.round}G${i + 1}`,
          start: slot.start,
          durationMins: slot.durationMins,
          field: slot.field,
          home: {
            pods: [blk.a, blk.b],
            teamName: `${name(blk.a)} + ${name(blk.b)}`,
          },
          away: {
            pods: [blk.c, blk.d],
            teamName: `${name(blk.c)} + ${name(blk.d)}`,
          },
          meta: {},
        };
      });

      return { round: r.round, games };
    });

    return { leagueId, rounds };
  }
}
