import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { UCService } from './uc.service';
import {
  EventsQuery,
  UC_EVENT_TYPES,
  UC_EVENT_ORDER_BY,
  parseCsvEnum,
  parseOptionalInt,
  parseStart,
  UCEventOrderBy,
} from './uc.types';

@Controller('uc')
export class UCController {
  constructor(private readonly uc: UCService) {}

  @Get('me')
  async me() {
    return this.uc.me();
  }

  @Get('events')
  async events(
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
      UC_EVENT_ORDER_BY.includes(order_by_raw as UCEventOrderBy)
    ) {
      params.order_by = order_by_raw as UCEventOrderBy;
    }

    const site_id = parseOptionalInt(site_id_raw);
    if (site_id !== undefined) params.site_id = site_id;

    const start = parseStart(start_raw);
    if (start !== undefined) {
      params.start = start;
    }

    return this.uc.listEvents(params);
  }

  @Get('events/:id')
  async eventById(@Param('id', ParseIntPipe) id: number) {
    const row = await this.uc.getEventById(id);
    return row ?? { status: 404, message: 'Not found' };
  }

  @Get('registrations')
  async registrations(
    @Query('eventId', ParseIntPipe) eventId: number,
    @Query('includePerson') includePerson?: string,
  ) {
    const inc = includePerson !== 'false';
    return this.uc.listRegistrations(eventId, inc);
  }
}
