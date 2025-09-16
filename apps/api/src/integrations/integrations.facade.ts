import { Inject, Injectable } from '@nestjs/common';
import {
  LEAGUE_PROVIDER,
  REGISTRATION_PROVIDER,
  TEAMS_PROVIDER,
  GAMES_PROVIDER,
  type ILeagueProvider,
  type IRegistrationProvider,
  type ITeamsProvider,
  type IGamesProvider,
} from './ports';

/**
 * Thin facade over the active provider(s). Useful if later you want to
 * switch by org/league configuration rather than a global provider.
 */
@Injectable()
export class IntegrationsFacade {
  constructor(
    @Inject(LEAGUE_PROVIDER) private readonly leagues: ILeagueProvider,
    @Inject(REGISTRATION_PROVIDER) private readonly regs: IRegistrationProvider,
    @Inject(TEAMS_PROVIDER) private readonly teams: ITeamsProvider,
    @Inject(GAMES_PROVIDER) private readonly games: IGamesProvider,
  ) {}

  leaguesApi() {
    return this.leagues;
  }
  registrationsApi() {
    return this.regs;
  }
  teamsApi(): ITeamsProvider {
    return this.teams;
  }
  gamesApi(): IGamesProvider {
    return this.games;
  }
}
