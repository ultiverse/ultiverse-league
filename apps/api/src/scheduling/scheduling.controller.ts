import { Body, Controller, Inject, Post } from '@nestjs/common';
import { FixturesService } from '../fixtures/fixtures.service';
import { PodSchedulerService } from './pod-scheduler.service';
import {
  PodScheduleByIdsDto,
  PodScheduleByLeagueDto,
  PodScheduleByUcEventDto,
  ScheduleRequestDto,
} from './dto';
import { FieldAllocator } from './field-allocator.util';
import {
  type ScheduleView,
  type ScheduleGameView,
  type RoundView,
  type ScheduleOutput,
} from './types';

import { TEAMS_PROVIDER } from '../integrations/ports';
import type { ITeamsProvider, TeamSummary } from '../integrations/ports';

@Controller('schedule')
export class SchedulingController {
  private readonly allocator: FieldAllocator;

  constructor(
    private readonly podScheduler: PodSchedulerService,
    private readonly fixtures: FixturesService,
    @Inject(TEAMS_PROVIDER) private readonly teamsProvider: ITeamsProvider,
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

  /**
   * Build pod schedule using provider teams for an external event.
   * Today we pass a UC event id, but this is wired through the generic Teams port.
   * Each external team becomes a "pod".
   */
  @Post('pods/by-uc-event')
  async buildPodsByUcEvent(@Body() dto: PodScheduleByUcEventDto) {
    const teamSummaries: TeamSummary[] = await this.teamsProvider.listTeams(
      String(dto.eventId),
    );

    const podIds = teamSummaries.map((t) => `uc:team:${t.id}`);

    const raw: ScheduleOutput = this.podScheduler.build({
      pods: podIds,
      rounds: dto.rounds,
      recencyWindow: dto.recencyWindow,
      skill: dto.skill,
      history: dto.history,
      pairingMode: dto.pairingMode ?? 'each-vs-both',
    });

    const leagueId = `uc:event:${dto.eventId}`;
    const nameByPod: Record<string, string> = {};
    for (const t of teamSummaries) {
      nameByPod[`uc:team:${t.id}`] = t.name ?? `Team ${t.id}`;
    }

    return this.mapBlocksToViewWithNames(raw, leagueId, nameByPod);
  }

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

  private mapBlocksToViewWithNames(
    raw: ScheduleOutput,
    leagueId: string | undefined,
    nameByPod: Record<string, string>,
  ): ScheduleView {
    const rounds: RoundView[] = raw.rounds.map((r, idx) => {
      const slots = this.allocator.allocate(r.blocks.length, {
        leagueId,
        roundIndex: idx,
        startBaseISO: '2025-06-01T22:00:00Z',
        durationMins: 60,
      });

      const games: ScheduleGameView[] = r.blocks.map((blk, i) => {
        const slot = slots[i];
        const n = (id: string) => nameByPod[id] ?? id;
        return {
          gameId: `R${r.round}G${i + 1}`,
          start: slot.start,
          durationMins: slot.durationMins,
          field: slot.field,
          home: { pods: [blk.a, blk.b], teamName: `${n(blk.a)} + ${n(blk.b)}` },
          away: { pods: [blk.c, blk.d], teamName: `${n(blk.c)} + ${n(blk.d)}` },
          meta: {},
        };
      });

      return { round: r.round, games };
    });

    return { leagueId, rounds };
  }
}
