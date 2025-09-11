import { Body, Controller, Post, Res } from '@nestjs/common';
import { type Response } from 'express';
import { ExportsService } from './exports.service';

@Controller('schedule')
export class ExportsController {
  constructor(private svc: ExportsService) {}

  @Post('csv')
  csv(@Body() body: { rows: Record<string, unknown>[] }, @Res() res: Response) {
    const csv = this.svc.toCsv(body.rows ?? []);
    res.setHeader('Content-Type', 'text/csv');
    return res.send(csv);
  }

  @Post('ics')
  ics(
    @Body()
    body: {
      events: {
        title: string;
        start: string;
        durationMins: number;
        location?: string;
      }[];
    },
    @Res() res: Response,
  ) {
    const events = (body.events ?? []).map((e) => ({
      ...e,
      start: new Date(e.start),
    }));
    const ics = this.svc.toIcs(events);
    res.setHeader('Content-Type', 'text/calendar');
    return res.send(ics);
  }
}
