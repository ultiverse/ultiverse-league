import { Inject, Injectable } from '@nestjs/common';
import {
  TeamSide,
  ScheduleView,
  GenerateOptions,
  Pod,
} from '@ultiverse/shared-types';
import { PodEngineAdapter } from './pod-engine/adapter.service';
import type {
  PodEngineSchedule,
  PodEngineMatch,
} from './pod-engine/pod-engine.types';

// 🟢 Use tokens & ports from Integrations (no local duplicates)
import { TEAMS_PROVIDER } from 'src/integrations/ports/tokens';
import type { ITeamsProvider } from 'src/integrations/ports/teams.port';

const DEFAULT_DURATION = 90;
const DEFAULT_BREAK = 15;
const DEFAULT_START_TIME = '18:00';

@Injectable()
export class SchedulesService {
  constructor(
    private readonly engine: PodEngineAdapter,
    @Inject(TEAMS_PROVIDER) private readonly teamsProvider: ITeamsProvider,
  ) {}

  /** Build a pod schedule view from pods (ids/names) + options (SYNC) */
  generatePodsView(podIds: string[], opts: GenerateOptions): ScheduleView {
    const names = opts.names ?? {};
    const pods: Pod[] = podIds.map((id) => ({ id, name: names[id] }));

    const base: PodEngineSchedule = this.engine.generate(pods, {
      rounds: opts.rounds,
      recencyWindow: opts.recencyWindow,
    });

    // We still assign times here so `start` is populated.
    // Important: pass through opts.fields, do NOT inject fake defaults.
    const withSlots: PodEngineSchedule = this.engine.assignTimesAndFields(
      base,
      {
        startDate: opts.startDate ?? new Date().toISOString().slice(0, 10),
        startTime: opts.startTime ?? DEFAULT_START_TIME,
        fields: opts.fields, // <- if undefined, engine may set its own defaults, but we ignore them below unless caller supplied fields
        matchDuration: opts.durationMins ?? DEFAULT_DURATION,
        breakBetweenMatches: opts.breakBetweenMins ?? DEFAULT_BREAK,
      },
    );

    const rounds = withSlots.rounds.map((round, rIdx) => {
      const games = round.matches.map((m: PodEngineMatch, i) => {
        const gameId = `R${rIdx + 1}G${i + 1}`;

        // Start: take engine’s scheduledTime or fall back to “now”
        const start: string = m.scheduledTime ?? new Date().toISOString();

        // Duration: prefer engine’s; else provided; else default
        const durationMins: number =
          (typeof m.duration === 'number' ? m.duration : undefined) ??
          opts.durationMins ??
          DEFAULT_DURATION;

        // Field: if the caller did NOT provide fields, expose null (don’t invent).
        // If caller provided fields, use engine’s field (or pick from provided list).
        let field: string | null = null;
        if (Array.isArray(opts.fields) && opts.fields.length > 0) {
          field = m.field ?? opts.fields[i % opts.fields.length];
        }

        const home: TeamSide = {
          pods: [m.team1.pod1.id, m.team1.pod2.id] as [string, string],
        };
        const away: TeamSide = {
          pods: [m.team2.pod1.id, m.team2.pod2.id] as [string, string],
        };

        return {
          gameId,
          start,
          durationMins,
          field, // ← string | null (see note below about types)
          home,
          away,
          meta: {},
        };
      });
      return { round: rIdx + 1, games };
    });

    return { leagueId: opts.leagueId, rounds };
  }

  /** GET schedule: fixtures or UC (teams as pods) */
  async getLeagueSchedule(
    leagueId: string,
    source: 'fixtures' | 'uc',
    rounds: number,
    ucEventId?: string,
  ): Promise<ScheduleView> {
    if (source === 'uc') {
      if (!ucEventId) {
        throw new Error('eventId is required when source=uc');
      }
      // Treat each UC team as a "pod"
      // Build IDs with prefix: uc:team:{id} ; leagueId as uc:event:{eventId}
      const ucTeams = await this.teamsProvider.listTeams(ucEventId);
      const podIds = ucTeams.map((t) => `uc:team:${t.id}`);
      const names: Record<string, string> = {};
      ucTeams.forEach((t) => {
        names[`uc:team:${t.id}`] = t.name;
      });
      return this.generatePodsView(podIds, {
        rounds,
        names,
        leagueId: `uc:event:${ucEventId}`,
      });
    }

    // fixtures: synthesize 8 pods for MVP (replace with real fixtures when available)
    const pods = Array.from({ length: 8 }, (_, i) => `fx:pod:${i + 1}`);
    const names = Object.fromEntries(pods.map((id) => [id, id.toUpperCase()]));
    return this.generatePodsView(pods, { rounds, names, leagueId });
  }
}
