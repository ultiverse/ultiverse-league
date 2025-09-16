import { Injectable } from '@nestjs/common';
import { UCRegistrationsResponse } from '../types/registrations';
import { UCClient } from '../uc.client';

type QueryParams = Record<string, string | number | boolean>;

@Injectable()
export class UCRegistrationsService {
  constructor(private readonly uc: UCClient) {}

  list(
    eventId: number,
    includePerson = true,
  ): Promise<UCRegistrationsResponse> {
    const params: QueryParams = { event_id: eventId };
    if (includePerson) params.fields = 'Person';
    return this.uc.get<UCRegistrationsResponse>('/api/registrations', params);
  }
}
