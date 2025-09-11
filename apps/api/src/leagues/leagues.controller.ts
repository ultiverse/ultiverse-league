import { Controller, Get, Param, Query } from '@nestjs/common';
import { FixturesService } from '../fixtures/fixtures.service';

@Controller('leagues')
export class LeaguesController {
  constructor(private fixtures: FixturesService) {}

  @Get('latest') latest() {
    return this.fixtures.getLeagues()[0] ?? null;
  }

  @Get('recent')
  recent(@Query('limit') limit?: string) {
    const rows = this.fixtures.getLeagues();
    return rows.slice(0, limit ? Number(limit) : 10);
  }

  @Get(':id')
  byId(@Param('id') id: string) {
    return this.fixtures.getLeagueById(id) ?? null;
  }

  @Get(':id/teams')
  byIdTeams(@Param('id') id: string, @Query('pods') pods?: string) {
    const kind = pods === 'true' ? 'pod' : undefined;
    return this.fixtures.getTeams(id, kind as any);
  }
}
