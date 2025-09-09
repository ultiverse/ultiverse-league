import { Inject, Injectable } from '@nestjs/common';
import { League } from '../domain/models';
import { LEAGUE_REPO, type LeagueRepository } from './ports/league.repository';

@Injectable()
export class LeaguesService {
  constructor(@Inject(LEAGUE_REPO) private repo: LeagueRepository) {}
  latest(): Promise<League | null> {
    return this.repo.findLatest();
  }
  recent(limit = 10): Promise<League[]> {
    return this.repo.findRecent(limit);
  }
  get(id: string): Promise<League | null> {
    return this.repo.findById(id);
  }
}
