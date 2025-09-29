/**
 * Application localStorage keys
 */
export const STORAGE_KEYS = {
  SELECTED_LEAGUE: 'ultiverse-selected-league',
  LAST_URL: 'ultiverse-last-url',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

/**
 * Days of the week constants
 */
export const DAYS_OF_WEEK = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
] as const;

export type DayOfWeek = typeof DAYS_OF_WEEK[number];