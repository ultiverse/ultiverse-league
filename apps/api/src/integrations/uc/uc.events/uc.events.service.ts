import { Injectable } from '@nestjs/common';
import { UCClient } from '../uc.client';
import {
  EventsQuery,
  toUcEventsParams,
  UCEventsResponse,
} from '@ultiverse/shared-types';

@Injectable()
export class UCEventsService {
  constructor(private readonly uc: UCClient) {}

  list(params?: EventsQuery) {
    return this.uc.get<UCEventsResponse>(
      '/api/events',
      toUcEventsParams(params),
    );
  }

  async getById(id: number) {
    const res = await this.list({ id });
    return res.result?.[0] ?? null;
  }
}
