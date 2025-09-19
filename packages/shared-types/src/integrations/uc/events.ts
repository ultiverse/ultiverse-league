import { Pagination, UC_EVENT_ORDER_BY, UCStartParam } from './common';

export interface UCEvent {
  model: 'event';
  id: number;
  type: string; // 'league', 'tournament', etc.
  name: string;
  start?: string; // 'YYYY-MM-DD' or datetime
  end?: string;
  slug?: string;
  organization_id?: number;
  site_id?: number;
  is_public?: boolean;
  images?: Record<string, string>;
  // Many more fields exist; keep the rest open:
  [k: string]: unknown;
}

export interface UCEventsResponse {
  action: string; // 'api_events_list'
  status: number;
  count: number;
  result: UCEvent[];
  errors?: unknown[];
}

export type EventsQuery = Pagination &
  Partial<{
    age: number[]; // multiple
    ancestor_page_id: number;
    all_tags: boolean;
    end: string; // YYYY-MM-DD
    event_series_id: number[]; // multiple
    event_status: ('registering' | 'happening')[]; // multiple
    family_id: number;
    id: number[] | number | string; // single | array | CSV string
    gender: ('men' | 'mixed' | 'open' | 'women')[]; // multiple
    order_by: 'date_desc' | 'date_asc' | 'name_asc' | 'start_date_asc';
    organization_id: number;
    person_id: number;
    publicity: 'any' | 'hidden' | 'person' | 'public' | 'coordinator';
    registration_status: (
      | 'accepted'
      | 'waitlisted'
      | 'pending'
      | 'incomplete'
      | 'inactive'
      | 'interested'
    )[]; // multiple
    search: string;
    service_id: number;
    site_id: number;
    site_list_scope: 'site' | 'network' | 'service';
    sport_id: number[]; // multiple
    surface: (
      | 'grass'
      | 'sand'
      | 'turf'
      | 'hard'
      | 'venue'
      | 'outdoor_venue'
      | 'ice'
      | 'indoor_turf'
      | 'indoor_pool'
      | 'outdoor_pool'
    )[]; // multiple
    start: UCStartParam; // allowed enum values
    tag: string[]; // multiple
    tag_ids: number[]; // multiple
    team_id: number;
    through: string; // YYYY-MM-DD
    type: (
      | 'administrative'
      | 'camp'
      | 'day camp'
      | 'class'
      | 'clinic'
      | 'coaching'
      | 'competition'
      | 'hat tournament'
      | 'function'
      | 'league'
      | 'meet'
      | 'other'
      | 'pickup'
      | 'race'
      | 'season'
      | 'tournament'
      | 'training'
      | 'tryout'
      | 'practice'
    )[]; // multiple
    location: string;
    region: string;
    country: string; // 2-char
    distance: number; // 1..10000
    distance_unit: 'km' | 'mi';
    latitude: number; // -90..90
    longitude: number; // -180..180
    locality: string;
    continent: string;
    is_fixed_bounds: boolean;
  }>;

export function toUcEventsParams(
  q?: EventsQuery,
): Record<string, string | number | boolean> | undefined {
  if (!q) return undefined;
  const out: Record<string, string | number | boolean> = {};

  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null) continue;

    if (Array.isArray(v)) {
      if (v.length === 0) continue;
      // Arrays are serialized as CSV per UC help
      out[k] = v.join(',');
      continue;
    }

    // Narrow to only the primitives the endpoint accepts
    if (
      typeof v === 'string' ||
      typeof v === 'number' ||
      typeof v === 'boolean'
    ) {
      out[k] = v;
      continue;
    }

    // If other types ever slip through, ignore them rather than sending junk
    // NOTE: This branch should be unreachable due to EventsQuery typing.
  }

  return Object.keys(out).length ? out : undefined;
}

export type UCEventOrderBy = (typeof UC_EVENT_ORDER_BY)[number];