import { Inject, Injectable } from '@nestjs/common';
import { POD_SCHEDULER } from './tokens';
import { PodSchedulerService } from './podscheduler.service';
import type { PodRef, PodEngineSchedule } from './pod-engine.types';

@Injectable()
export class PodEngineAdapter {
  constructor(
    @Inject(POD_SCHEDULER) private readonly engine: PodSchedulerService,
  ) {}

  generate(
    pods: PodRef[],
    opts: { rounds: number; recencyWindow?: number },
  ): PodEngineSchedule {
    return this.engine.generateSchedule(pods, {
      rounds: opts.rounds,
      recencyWindow: opts.recencyWindow,
    });
  }

  assignTimesAndFields(
    s: PodEngineSchedule,
    opts: {
      startDate?: string;
      startTime?: string;
      fields?: string[];
      matchDuration?: number;
      breakBetweenMatches?: number;
    },
  ): PodEngineSchedule {
    return this.engine.assignTimesAndFields(s, opts);
  }

  exportCSV(s: PodEngineSchedule): string {
    return this.engine.exportCSV(s);
  }
  exportICS(s: PodEngineSchedule): string {
    return this.engine.exportICS(s);
  }
}
