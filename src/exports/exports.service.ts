import { Injectable } from '@nestjs/common';
import { createEvents } from 'ics';

@Injectable()
export class ExportsService {
  toCsv(rows: Record<string, unknown>[]) {
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    const body = rows
      .map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(','))
      .join('\n');
    return headers.join(',') + '\n' + body + '\n';
  }

  toIcs(
    events: {
      title: string;
      start: Date;
      durationMins: number;
      location?: string;
    }[],
  ) {
    const mapped = events.map((e) => ({
      title: e.title,
      start: [
        e.start.getFullYear(),
        e.start.getMonth() + 1,
        e.start.getDate(),
        e.start.getHours(),
        e.start.getMinutes(),
      ] as [number, number, number, number, number],
      duration: { minutes: e.durationMins },
      location: e.location,
    }));
    const { value, error } = createEvents(mapped);
    if (error) throw error;
    return value ?? '';
  }
}
