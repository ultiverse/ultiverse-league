import { Test } from '@nestjs/testing';
import { PodSchedulerService } from '../src/scheduling/pod-scheduler.service';
import { CostService } from '../src/scheduling/cost.service';
import { MatchingService } from '../src/scheduling/matching.service';
import { verifyScheduleView } from '../src/scheduling/verify-schedule.util';
import { FieldAllocator } from '../src/scheduling/field-allocator.util';
import { FixturesService } from '../src/fixtures/fixtures.service';
import { ScheduleView } from '../src/scheduling/types';

describe('PodScheduler – verification (8 pods, 6 rounds)', () => {
  let scheduler: PodSchedulerService;
  let fixtures: FixturesService;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      providers: [
        PodSchedulerService,
        CostService,
        MatchingService,
        FixturesService,
      ],
    }).compile();
    scheduler = modRef.get(PodSchedulerService);
    fixtures = modRef.get(FixturesService);
  });

  function mapBlocksToView(
    raw: ReturnType<PodSchedulerService['build']>,
  ): ScheduleView {
    const allocator = new FieldAllocator(fixtures);
    return {
      leagueId: 'TEST',
      rounds: raw.rounds.map((r, idx) => {
        const slots = allocator.allocate(r.blocks.length, {
          leagueId: 'TEST',
          roundIndex: idx,
          startBaseISO: '2025-06-01T22:00:00Z',
          durationMins: 60,
        });
        return {
          round: r.round,
          games: r.blocks.map((blk, i) => ({
            gameId: `R${r.round}G${i + 1}`,
            start: slots[i].start,
            durationMins: slots[i].durationMins,
            field: slots[i].field,
            home: { pods: [blk.a, blk.b], teamName: `${blk.a}+${blk.b}` },
            away: { pods: [blk.c, blk.d], teamName: `${blk.c}+${blk.d}` },
            meta: {},
          })),
        };
      }),
    };
  }

  it('keeps early repeats low and avoids recency violations', () => {
    // 8 pods → P1..P8
    const pods = Array.from({ length: 8 }, (_, i) => `P${i + 1}`);

    const raw = scheduler.build({
      pods,
      rounds: 6,
      recencyWindow: 2,
      baseRoundIndex: 0,
    });

    const schedule = mapBlocksToView(raw);

    const result = verifyScheduleView(schedule, {
      recencyWindow: 2,
      maxEarlyOppRepeats: 4, // allow a few
      maxEarlyPartnerRepeats: 0, // partners should not repeat early
      maxRecencyViolations: 0, // strict on recency
      checkFairness: false, // enable later if desired
    });

    // If you want to debug locally, you can log result.violations here.
    expect(result.pass).toBe(true);
  });
});
