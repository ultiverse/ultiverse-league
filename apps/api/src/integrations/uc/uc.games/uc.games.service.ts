import { Injectable } from '@nestjs/common';
import {
  GamesQuery,
  toUcGamesParams,
  UCGamesResponse,
} from '@ultiverse/shared-types';
import { UCClient } from '../uc.client';

@Injectable()
export class UCGamesService {
  constructor(private readonly uc: UCClient) {}

  list(params: GamesQuery): Promise<UCGamesResponse> {
    const qp = toUcGamesParams(params);
    return this.uc.get<UCGamesResponse>('/api/games', qp);
  }
}
