import { YesNo } from './common';

export interface UCMeItem {
  person_id: number;
  api_csrf_valid: YesNo;
}
export interface UCMeResponse {
  action: 'api_me';
  status: number;
  count: number;
  result: UCMeItem[];
  errors: unknown[];
}
