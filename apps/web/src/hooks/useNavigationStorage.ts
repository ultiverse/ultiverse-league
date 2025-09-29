import { useCallback } from 'react';
import { localStorage } from '../utils/localStorage.util';
import { STORAGE_KEYS } from '../constants/storage';

/**
 * Hook for managing navigation-specific localStorage operations
 * Contains business logic for navigation persistence
 */
export function useNavigationStorage() {
  const saveLastUrl = useCallback((url: string): void => {
    localStorage.set(STORAGE_KEYS.LAST_URL, url);
  }, []);

  const loadLastUrl = useCallback((): string | null => {
    return localStorage.get<string>(STORAGE_KEYS.LAST_URL);
  }, []);

  const clearLastUrl = useCallback((): void => {
    localStorage.remove(STORAGE_KEYS.LAST_URL);
  }, []);

  const hasLastUrl = useCallback((): boolean => {
    return localStorage.has(STORAGE_KEYS.LAST_URL);
  }, []);

  return {
    saveLastUrl,
    loadLastUrl,
    clearLastUrl,
    hasLastUrl,
  };
}