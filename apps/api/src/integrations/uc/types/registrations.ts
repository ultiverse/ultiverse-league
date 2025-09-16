export interface UCPerson {
  model: 'person';
  id: number;
  email_address?: string;
  email_canonical?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  gender?: string;
  player_rating?: number | null;
  images?: Record<string, string>;
  [k: string]: unknown;
}

export interface UCRegistration {
  model: 'registration';
  id: number;
  person_id: number;
  event_id: number;
  status: string;
  role?: string;
  roles?: string[];
  Person?: UCPerson;
  [k: string]: unknown;
}

export interface UCRegistrationsResponse {
  action: string; // 'api_registrations_list'
  status: number;
  count: number;
  result: UCRegistration[];
  errors?: unknown[];
}
