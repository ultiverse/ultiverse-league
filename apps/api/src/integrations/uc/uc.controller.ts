import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';

import { UCClient } from './uc.client';
import { UCEventsService } from './uc.events/uc.events.service';
import { UCRegistrationsService } from './uc.registrations/uc.registrations.service';
import { UCTeamsService } from './uc.teams/uc.teams.service';

import {
  EventsQuery,
  TeamsQuery,
  UCEventOrderBy,
  UCMeResponse,
  UC_EVENT_TYPES,
  UC_EVENT_ORDER_BY,
  parseCsvEnum,
  parseOptionalInt,
  parseStart,
} from '@ultiverse/shared-types';

/**
 * UCController
 *
 * Development-only convenience endpoints for hitting Ultimate Central directly.
 * These are intentionally thin and delegate to the UC client/services so we
 * can test credentials, shape of responses, and query param handling.
 *
 * NOTE: Domain modules should NOT depend on this controller. They should instead
 *       depend on the provider-agnostic ports (leagues, registrations, teams, games)
 *       via the Integrations facade or DI tokens.
 */
@Controller('uc')
export class UCController {
  constructor(
    private readonly client: UCClient,
    private readonly events: UCEventsService,
    private readonly regs: UCRegistrationsService,
    private readonly teamsService: UCTeamsService,
  ) {}

  /**
   * GET /uc/me
   * Returns the current UC identity (useful to verify OAuth wiring/person_id).
   */
  @Get('me')
  async me(): Promise<UCMeResponse> {
    return this.client.get<UCMeResponse>('/api/me');
  }

  /**
   * GET /uc/events
   * Lists UC events/leagues with a small set of supported query params:
   *   - type: CSV of allowed event types (filtered via allow-list)
   *   - order_by: allow-listed sort order
   *   - site_id: numeric filter
   *   - start: keyword ('all'|'current'|'future'|'ongoing') or YYYY-MM-DD
   */
  @Get('events')
  async getEvents(
    @Query('type') typeCSV?: string,
    @Query('order_by') order_by_raw?: string,
    @Query('site_id') site_id_raw?: string,
    @Query('start') start_raw?: string,
  ) {
    const params: EventsQuery = {};

    if (typeCSV) {
      const types = parseCsvEnum(typeCSV, UC_EVENT_TYPES);
      if (types.length) params.type = types;
    }

    if (
      order_by_raw &&
      (UC_EVENT_ORDER_BY as readonly string[]).includes(order_by_raw)
    ) {
      params.order_by = order_by_raw as UCEventOrderBy;
    }

    const site_id = parseOptionalInt(site_id_raw);
    if (site_id !== undefined) params.site_id = site_id;

    const start = parseStart(start_raw);
    if (start !== undefined) params.start = start;

    return this.events.list(params);
  }

  /**
   * GET /uc/events/:id
   * Convenience single fetch. Returns 404 payload when not found.
   */
  @Get('events/:id')
  async eventById(@Param('id', ParseIntPipe) id: number) {
    const row = await this.events.getById(id);
    return row ?? { status: 404, message: 'Not found' };
  }

  /**
   * GET /uc/registrations?eventId=...&includePerson=true|false
   * Lists registrations for an event (league). `includePerson` defaults to true
   * unless the literal string "false" is provided.
   */
  @Get('registrations')
  async registrations(
    @Query('eventId', ParseIntPipe) eventId: number,
    @Query('includePerson') includePerson?: string,
  ) {
    const inc = includePerson !== 'false';
    return this.regs.list(eventId, inc);
  }

  /**
   * GET /uc/teams?event_id=...
   * Lists teams for an event (league).
   */
  @Get('teams')
  async teams(@Query('event_id', ParseIntPipe) event_id: number) {
    return this.teamsService.list({ event_id });
  }
}
