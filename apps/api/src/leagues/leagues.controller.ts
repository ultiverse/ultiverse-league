import { Controller, Get, Param, Query, Inject } from '@nestjs/common';
import { FixturesService } from '../fixtures/fixtures.service';
import { LEAGUE_PROVIDER, TEAMS_PROVIDER } from '../integrations/ports';
import type { ILeagueProvider, ITeamsProvider } from '../integrations/ports';

@Controller('leagues')
export class LeaguesController {
  constructor(
    private fixtures: FixturesService,
    @Inject(LEAGUE_PROVIDER) private leagueProvider: ILeagueProvider,
    @Inject(TEAMS_PROVIDER) private teamsProvider: ITeamsProvider,
  ) {}

  @Get('latest')
  async latest(@Query('integration') integration?: string) {
    if (integration === 'external') {
      const leagues = await this.leagueProvider.listRecent();
      return leagues[0] ?? null;
    }
    return this.fixtures.getLeagues()[0] ?? null;
  }

  @Get('recent')
  async recent(
    @Query('limit') limit?: string,
    @Query('integration') integration?: string,
    @Query('order_by') orderBy?: string,
  ) {
    const limitNum = limit ? Number(limit) : 10;

    if (integration === 'external') {
      const leagues = await this.leagueProvider.listRecent();
      return leagues.slice(0, limitNum);
    }

    const rows = this.fixtures.getLeagues();
    return rows.slice(0, limitNum);
  }

  @Get(':id')
  async byId(
    @Param('id') id: string,
    @Query('integration') integration?: string,
  ) {
    if (integration === 'external') {
      return await this.leagueProvider.getLeagueById(id);
    }
    return this.fixtures.getLeagueById(id) ?? null;
  }

  @Get(':id/teams')
  async byIdTeams(
    @Param('id') id: string,
    @Query('pods') pods?: string,
    @Query('integration') integration?: string,
  ) {
    if (integration === 'external') {
      const teams = await this.teamsProvider.listTeams(id);
      return teams;
    }

    const kind = pods === 'true' ? 'pod' : undefined;
    return this.fixtures.getTeams(id, kind as any);
  }
}
