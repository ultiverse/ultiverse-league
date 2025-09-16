import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { UCClient } from './uc.client';
import { UCAdapter } from './uc.adapter';

import { UCEventsService } from './uc.events/uc.events.service';
import { UCRegistrationsService } from './uc.registrations/uc.registrations.service';
import { UCTeamsService } from './uc.teams/uc.teams.service';
import { UCGamesService } from './uc.games/uc.games.service';

import {
  LEAGUE_PROVIDER,
  REGISTRATION_PROVIDER,
  TEAMS_PROVIDER,
  GAMES_PROVIDER,
} from '../ports/tokens';

import { UCController } from './uc.controller';

@Module({
  imports: [ConfigModule],
  controllers: [UCController],
  providers: [
    UCClient,
    UCEventsService,
    UCRegistrationsService,
    UCTeamsService,
    UCGamesService,
    UCAdapter,

    { provide: LEAGUE_PROVIDER, useExisting: UCAdapter },
    { provide: REGISTRATION_PROVIDER, useExisting: UCAdapter },
    { provide: TEAMS_PROVIDER, useExisting: UCAdapter },
    { provide: GAMES_PROVIDER, useExisting: UCAdapter },
  ],
  exports: [
    LEAGUE_PROVIDER,
    REGISTRATION_PROVIDER,
    TEAMS_PROVIDER,
    GAMES_PROVIDER,
  ],
})
export class UCModule {}
