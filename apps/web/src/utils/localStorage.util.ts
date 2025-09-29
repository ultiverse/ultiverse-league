/**
 * Generic localStorage utility with error handling
 * This is a pure technical utility without business logic
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

  /**
   * Check if a key exists in localStorage
   */
  has(key: string): boolean {
    try {
      return window.localStorage.getItem(key) !== null;
    } catch (error) {
      console.warn('Failed to check localStorage:', error);
      return false;
    }
  },

  /**
   * Get all keys from localStorage with optional prefix filter
   */
  getKeys(prefix?: string): string[] {
    try {
      const keys = Object.keys(window.localStorage);
      return prefix ? keys.filter(key => key.startsWith(prefix)) : keys;
    } catch (error) {
      console.warn('Failed to get localStorage keys:', error);
      return [];
    }
  },
};