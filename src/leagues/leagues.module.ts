import { Module } from '@nestjs/common';
import { LeaguesController } from './leagues.controller';
import { LeaguesService } from './leagues.service';
import { LEAGUE_REPO } from './ports/league.repository';
import { JsonLeagueRepository } from './adapters/json.league.repo';

@Module({
  controllers: [LeaguesController],
  providers: [
    LeaguesService,
    { provide: LEAGUE_REPO, useClass: JsonLeagueRepository },
  ],
  exports: [LeaguesService],
})
export class LeaguesModule {}
