import { Module } from '@nestjs/common';
import { LeaguesController } from './leagues.controller';
import { LeaguesService } from './leagues.service';
import { LEAGUE_REPO } from './ports/league.repository';
import { JsonLeagueRepository } from './adapters/json.league.repo';
import { FixturesService } from 'src/fixtures/fixtures.service';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [IntegrationsModule],
  controllers: [LeaguesController],
  providers: [
    LeaguesService,
    FixturesService,
    { provide: LEAGUE_REPO, useClass: JsonLeagueRepository },
  ],
  exports: [LeaguesService, FixturesService],
})
export class LeaguesModule {}
