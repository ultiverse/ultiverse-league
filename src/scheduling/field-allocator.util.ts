import { FixturesService } from '../fixtures/fixtures.service';
import { ScheduleGameView } from './types';

export interface AllocationOpts {
  leagueId?: string;
  roundIndex: number; // 0-based
  startBaseISO?: string; // default base time if no slots (e.g., "2025-06-01T18:00:00Z")
  durationMins?: number; // default 60
}

export class FieldAllocator {
  constructor(private fixtures: FixturesService) {}

  allocate(
    numGames: number,
    opts: AllocationOpts,
  ): Pick<ScheduleGameView, 'start' | 'durationMins' | 'field'>[] {
    const fields = this.fixtures.getFields();
    if (fields.length === 0) throw new Error('No fields available in fixtures');

    const duration = opts.durationMins ?? 60;
    const base = opts.startBaseISO ?? '2025-06-01T18:00:00Z';

    const baseDate = new Date(base);
    // shift base by roundIndex (e.g., weekly cadence), for demo add 7 days per round
    const roundStart = new Date(
      baseDate.getTime() + opts.roundIndex * 7 * 24 * 60 * 60 * 1000,
    );

    const out: Pick<ScheduleGameView, 'start' | 'durationMins' | 'field'>[] =
      [];
    for (let i = 0; i < numGames; i++) {
      const field = fields[i % fields.length];
      // All games same start in demo; you can stagger if desired
      out.push({
        start: roundStart.toISOString(),
        durationMins: duration,
        field: { id: field.id, name: field.name },
      });
    }
    return out;
  }
}
