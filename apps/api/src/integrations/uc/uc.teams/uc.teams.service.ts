import { Injectable } from '@nestjs/common';
import { TeamsQuery, toUcTeamsParams, UCTeamsResponse } from '../types/teams';
import { UCClient } from '../uc.client';

@Injectable()
export class UCTeamsService {
  constructor(private readonly uc: UCClient) {}

  list(params: TeamsQuery): Promise<UCTeamsResponse> {
    const qp = toUcTeamsParams(params);
    return this.uc.get<UCTeamsResponse>('/api/teams', qp);
  }
}
