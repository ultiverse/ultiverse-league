import { Injectable } from '@nestjs/common';

type GameBlock = { a: string; b: string; c: string; d: string };
type Round = { blocks: GameBlock[] };

@Injectable()
export class SchedulingService {
  // simple round-robin pod pairing *stub*: pair adjacent pods into blocks
  buildSchedule(pods: string[], rounds: number): Round[] {
    const blocksPerRound: GameBlock[] = [];
    for (let i = 0; i < pods.length; i += 4) {
      if (i + 3 < pods.length) {
        blocksPerRound.push({
          a: pods[i],
          b: pods[i + 1],
          c: pods[i + 2],
          d: pods[i + 3],
        });
      }
    }
    return Array.from({ length: rounds }, () => ({ blocks: blocksPerRound }));
  }
}
