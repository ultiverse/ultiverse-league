// ---------- Common ----------
export type YesNo = 'yes' | 'no';

// ---------- /api/me ----------
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

// ---------- /api/events ----------
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

/**
 * Only fields allowed by UC /api/events help.
 * Multi-value fields use arrays; we’ll serialize them as CSV in a helper.
 */
export type EventsQuery = Partial<{
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

/** Serialize EventsQuery to UC-friendly params (arrays → CSV, drop empty/undefined). */
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

// ---------- /api/registrations (with Person) ----------
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

// --- Allowed literals (kept in one place so TS infers unions) ---
export const UC_EVENT_TYPES = [
  'administrative',
  'camp',
  'day camp',
  'class',
  'clinic',
  'coaching',
  'competition',
  'hat tournament',
  'function',
  'league',
  'meet',
  'other',
  'pickup',
  'race',
  'season',
  'tournament',
  'training',
  'tryout',
  'practice',
] as const;
export type UCEventType = (typeof UC_EVENT_TYPES)[number];

export const UC_EVENT_ORDER_BY = [
  'date_desc',
  'date_asc',
  'name_asc',
  'start_date_asc',
] as const;
export type UCEventOrderBy = (typeof UC_EVENT_ORDER_BY)[number];

export const UC_EVENT_STATUS = ['registering', 'happening'] as const;
export type UCEventStatus = (typeof UC_EVENT_STATUS)[number];

export const UC_GENDER = ['men', 'mixed', 'open', 'women'] as const;
export type UCGender = (typeof UC_GENDER)[number];

export const UC_START_KEYWORDS = [
  'all',
  'current',
  'future',
  'ongoing',
] as const;
export type UCStartKeyword = (typeof UC_START_KEYWORDS)[number];

// Brand for date strings accepted by UC (e.g., "YYYY-MM-DD")
export type UCDateString = string & { readonly __ucDateString: unique symbol };

// Start query can be a keyword or a branded date string
export type UCStartParam = UCStartKeyword | UCDateString;

// Type guard to brand a date-ish string
export function toUCDateString(value: string): UCDateString {
  return value as UCDateString;
}

// --- Narrowing helpers (type guards) ---
export function parseCsvEnum<T extends string>(
  csv: string,
  allowed: readonly T[],
): T[] {
  const set = new Set(allowed);
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is T => set.has(s as T));
}

export function parseOptionalInt(v?: string): number | undefined {
  if (v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function parseStart(value?: string): UCStartParam | undefined {
  if (!value) return undefined;
  const lower = value.toLowerCase();
  if ((UC_START_KEYWORDS as readonly string[]).includes(lower)) {
    return lower as UCStartKeyword;
  }
  // Accept raw date strings; brand them so the union isn't plain `string`.
  // If you want validation, add a regex like: /^\d{4}-\d{2}-\d{2}(\b|T)/
  return toUCDateString(value);
}
