import { Injectable } from '@nestjs/common';
import { UCRegistrationsResponse } from '@ultiverse/shared-types';
import { UCClient } from '../uc.client';

@Injectable()
export class UCRegistrationsService {
  constructor(private readonly uc: UCClient) {}

  list(
    eventId: number,
    options?: {
      includePerson?: boolean;
      includeTeam?: boolean;
      teamId?: number;
      page?: number;
      perPage?: number;
    },
  ): Promise<UCRegistrationsResponse> {
    const params: Record<string, string | number | boolean | string[]> = {
      event_id: eventId
    };

    // Add fields
    const fields: string[] = [];
    if (options?.includePerson !== false) fields.push('Person');
    if (options?.includeTeam) fields.push('Team');
    if (fields.length > 0) {
      params['fields[]'] = fields;
    }

    // Add team filter if specified
    if (options?.teamId) {
      params.team_id = options.teamId;
    }

    // Add pagination
    if (options?.page) params.page = options.page;
    if (options?.perPage) params.per_page = options.perPage;

    return this.uc.get<UCRegistrationsResponse>('/api/registrations', params);
  }
}
