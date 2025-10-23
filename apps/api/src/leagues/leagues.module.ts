import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaguesController } from './leagues.controller';
import { LeaguesService } from './leagues.service';
import { LEAGUE_REPO } from './ports/league.repository';
import { TypeOrmLeagueRepository } from './adapters/typeorm.league.repo';
import { FixturesService } from 'src/fixtures/fixtures.service';
import { IntegrationsModule } from '../integrations/integrations.module';
import {
  League,
  ExternalLeagueSource,
  IntegrationConnection,
} from '../database/entities';

@Module({
  imports: [
    IntegrationsModule,
    TypeOrmModule.forFeature([
      League,
      ExternalLeagueSource,
      IntegrationConnection,
    ]),
  ],
  controllers: [LeaguesController],
  providers: [
    LeaguesService,
    FixturesService,
    { provide: LEAGUE_REPO, useClass: TypeOrmLeagueRepository },
  ],
  exports: [LeaguesService, FixturesService],
})
export class LeaguesModule {}
