import { Injectable } from '@nestjs/common';
import { FieldsQuery, toUcFieldsParams, UCFieldsResponse } from '../types/fields';
import { UCClient } from '../uc.client';

@Injectable()
export class UCFieldsService {
  constructor(private readonly uc: UCClient) {}

  list(params: FieldsQuery): Promise<UCFieldsResponse> {
    const qp = toUcFieldsParams(params);
    return this.uc.get<UCFieldsResponse>('/api/fields', qp);
  }
}