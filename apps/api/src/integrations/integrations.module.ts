import { Module } from '@nestjs/common';
import { UCAdapter } from './uc/uc.adapter';
import {
  GAMES_PROVIDER,
  LEAGUE_PROVIDER,
  REGISTRATION_PROVIDER,
  TEAMS_PROVIDER,
  USER_PROVIDER,
  FIELDS_PROVIDER,
} from './ports';
import { UCModule } from './uc/uc.module';
import { UCEventsService } from './uc/uc.events/uc.events.service';
import { UCRegistrationsService } from './uc/uc.registrations/uc.registrations.service';
import { UCTeamsService } from './uc/uc.teams/uc.teams.service';
import { UCGamesService } from './uc/uc.games/uc.games.service';
import { UCFieldsService } from './uc/uc.fields/uc.fields.service';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';

@Module({
  imports: [UCModule],
  controllers: [IntegrationsController],
  providers: [
    // Integration management service
    IntegrationsService,
    // concrete UC services used by the adapter
    UCEventsService,
    UCRegistrationsService,
    UCTeamsService,
    UCGamesService,
    UCFieldsService,
    // the adapter that implements the ports
    UCAdapter,
    // bind all ports to the adapter
    { provide: LEAGUE_PROVIDER, useExisting: UCAdapter },
    { provide: TEAMS_PROVIDER, useExisting: UCAdapter },
    { provide: REGISTRATION_PROVIDER, useExisting: UCAdapter },
    { provide: GAMES_PROVIDER, useExisting: UCAdapter },
    { provide: USER_PROVIDER, useExisting: UCAdapter },
    { provide: FIELDS_PROVIDER, useExisting: UCAdapter },
  ],
  exports: [
    IntegrationsService,
    LEAGUE_PROVIDER,
    TEAMS_PROVIDER,
    REGISTRATION_PROVIDER,
    GAMES_PROVIDER,
    USER_PROVIDER,
    FIELDS_PROVIDER,
  ],
})
export class IntegrationsModule {}
