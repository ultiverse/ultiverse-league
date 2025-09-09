import { Injectable } from '@nestjs/common';
import { League } from '../../domain/models';
import { LeagueRepository } from '../ports/league.repository';
import { JsonStore } from '../../persistence/json.store';

@Injectable()
export class JsonLeagueRepository implements LeagueRepository {
  private store = new JsonStore<League>('leagues.json');

  async findLatest() {
    return (await this.store.all())[0] ?? null;
  }
  async findRecent(limit: number) {
    return (await this.store.all()).slice(0, limit);
  }
  async findById(id: string) {
    return (await this.store.all()).find((r) => r.id === id) ?? null;
  }
}
