/**
 * Application localStorage keys
 */
export const STORAGE_KEYS = {
  SELECTED_LEAGUE: 'ultiverse-selected-league',
  LAST_URL: 'ultiverse-last-url',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];