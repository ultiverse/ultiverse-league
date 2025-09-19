export type YesNo = 'yes' | 'no';

export type Pagination = {
  page?: number; // 1-based
  per_page?: number; // 1..100
};

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