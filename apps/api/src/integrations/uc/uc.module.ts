import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from '../../database/entities';

import { UCClient } from './uc.client';
import { UCController } from './uc.controller';

import { UCEventsService } from './uc.events/uc.events.service';
import { UCRegistrationsService } from './uc.registrations/uc.registrations.service';
import { UCTeamsService } from './uc.teams/uc.teams.service';
import { UCGamesService } from './uc.games/uc.games.service';
import { UCFieldsService } from './uc.fields/uc.fields.service';
import { UCPlayersService } from './uc.players/uc.players.service';
import { UCEnrichmentService } from './uc-enrichment.service';
import { UCLeagueAdapter } from './uc-league.adapter';

import { UCAdapter } from './uc.adapter';
import {
  LEAGUE_PROVIDER,
  REGISTRATION_PROVIDER,
  TEAMS_PROVIDER,
  GAMES_PROVIDER,
  PLAYERS_PROVIDER,
} from '../ports';
import { TeamsModule } from '../../teams/teams.module';
import { ImportModule } from '../../imports/import.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Team]),
    TeamsModule,
    ImportModule,
  ],
  controllers: [UCController],
  providers: [
    UCClient,
    UCEventsService,
    UCRegistrationsService,
    UCTeamsService,
    UCGamesService,
    UCFieldsService,
    UCPlayersService,
    UCEnrichmentService,
    UCLeagueAdapter,
    UCAdapter,

    // expose adapter under port tokens
    { provide: LEAGUE_PROVIDER, useExisting: UCAdapter },
    { provide: REGISTRATION_PROVIDER, useExisting: UCAdapter },
    { provide: TEAMS_PROVIDER, useExisting: UCAdapter },
    { provide: GAMES_PROVIDER, useExisting: UCAdapter },
    { provide: PLAYERS_PROVIDER, useExisting: UCAdapter },
  ],
  exports: [
    // export tokens so other modules can inject the ports
    LEAGUE_PROVIDER,
    REGISTRATION_PROVIDER,
    TEAMS_PROVIDER,
    GAMES_PROVIDER,
    PLAYERS_PROVIDER,

    // Export for other modules to use
    UCClient,
    UCEventsService,
    UCRegistrationsService,
    UCTeamsService,
    UCGamesService,
    UCFieldsService,
    UCPlayersService,
    UCEnrichmentService,
    UCLeagueAdapter,
  ],
})
export class UCModule {}
