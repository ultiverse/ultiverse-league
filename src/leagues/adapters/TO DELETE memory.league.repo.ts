import { Injectable } from '@nestjs/common';
import { League } from '../../domain/models';
import { LeagueRepository } from '../ports/league.repository';

const SEED: League[] = [
  { id: 'l1', name: 'Fall 2025 Pods', type: 'league' },
  { id: 'l2', name: 'Winter 2026 League', type: 'league' },
];

@Injectable()
export class MemoryLeagueRepository implements LeagueRepository {
  private data = SEED;
  async findLatest() {
    return this.data[0] ?? null;
  }
  async findRecent(limit: number) {
    return this.data.slice(0, limit);
  }
  async findById(id: string) {
    return this.data.find((l) => l.id === id) ?? null;
  }
}
