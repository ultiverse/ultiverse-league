import { LeagueSummary } from '@/api/uc';

const STORAGE_KEYS = {
  SELECTED_LEAGUE: 'ultiverse-selected-league',
  LAST_URL: 'ultiverse-last-url',
} as const;

/**
 * Generic localStorage utility with error handling
 */
export const localStorage = {
  /**
   * Save data to localStorage
   */
  set<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },

  /**
   * Get data from localStorage
   */
  get<T>(key: string): T | null {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  },

  /**
   * Remove data from localStorage
   */
  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  },

  /**
   * Clear all localStorage data
   */
  clear(): void {
    try {
      window.localStorage.clear();
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  },
};

/**
 * League-specific localStorage utilities
 */
export const leagueStorage = {
  /**
   * Save selected league to localStorage
   */
  saveSelectedLeague(league: LeagueSummary | null): void {
    if (league) {
      localStorage.set(STORAGE_KEYS.SELECTED_LEAGUE, league);
    } else {
      localStorage.remove(STORAGE_KEYS.SELECTED_LEAGUE);
    }
  },

  /**
   * Load selected league from localStorage
   */
  loadSelectedLeague(): LeagueSummary | null {
    return localStorage.get<LeagueSummary>(STORAGE_KEYS.SELECTED_LEAGUE);
  },

  /**
   * Clear selected league from localStorage
   */
  clearSelectedLeague(): void {
    localStorage.remove(STORAGE_KEYS.SELECTED_LEAGUE);
  },
};

/**
 * Navigation-specific localStorage utilities
 */
export const navigationStorage = {
  /**
   * Save last visited URL to localStorage
   */
  saveLastUrl(url: string): void {
    localStorage.set(STORAGE_KEYS.LAST_URL, url);
  },

  /**
   * Load last visited URL from localStorage
   */
  loadLastUrl(): string | null {
    return localStorage.get<string>(STORAGE_KEYS.LAST_URL);
  },

  /**
   * Clear last URL from localStorage
   */
  clearLastUrl(): void {
    localStorage.remove(STORAGE_KEYS.LAST_URL);
  },
};