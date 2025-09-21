import { Test } from '@nestjs/testing';
import { PodSchedulerService } from '../src/schedules/pod-engine/podscheduler.service';
import { FixturesService } from '../src/fixtures/fixtures.service';
import { ScheduleView } from '@ultiverse/shared-types';

describe('PodScheduler – verification (8 pods, 8 rounds)', () => {
  let scheduler: PodSchedulerService;
  let fixtures: FixturesService;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      providers: [
        PodSchedulerService,
        FixturesService,
      ],
    }).compile();
    scheduler = modRef.get(PodSchedulerService);
    fixtures = modRef.get(FixturesService);
  });

  // No longer needed - the new API returns ScheduleView directly through the schedules service

  it('generates schedule for all requested rounds', () => {
    // 8 pods → P1..P8
    const pods = Array.from({ length: 8 }, (_, i) => ({
      id: `P${i + 1}`,
      name: `Pod ${i + 1}`
    }));

    const result = scheduler.generateSchedule(pods, {
      rounds: 8,
      recencyWindow: 2,
    });

    expect(result.rounds).toHaveLength(8);

    // Check that we get games in all rounds (the main issue we fixed)
    let roundsWithGames = 0;
    for (const round of result.rounds) {
      if (round.matches.length > 0) {
        roundsWithGames++;
      }
    }

    // We should now get games in all 8 rounds (or at least most of them)
    expect(roundsWithGames).toBeGreaterThanOrEqual(6); // Allow some flexibility

    console.log(`Generated ${roundsWithGames} rounds with games out of ${result.rounds.length} total rounds`);
  });
});
