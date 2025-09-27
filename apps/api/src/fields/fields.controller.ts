import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { FieldsService } from './fields.service';

@Controller('fields')
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  /**
   * GET /fields?event_id=...
   * Lists fields grouped by venue with subfields for an event (league).
   * Returns fields in the format: { venue, subfields[], map }
   */
  @Get()
  async getFields(@Query('event_id', ParseIntPipe) eventId: number) {
    return this.fieldsService.getFieldsByEventId(eventId);
  }
}