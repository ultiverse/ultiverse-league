import { League } from '@ultiverse/shared-types';

export interface LeagueRepository {
  findLatest(): Promise<League | null>;
  findRecent(limit: number): Promise<League[]>;
  findById(id: string): Promise<League | null>;
}
export const LEAGUE_REPO = Symbol('LEAGUE_REPO');
