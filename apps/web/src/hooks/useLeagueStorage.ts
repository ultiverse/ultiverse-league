import { useCallback } from 'react';
import { localStorage } from '../utils/localStorage.util';
import { STORAGE_KEYS } from '../constants';
import { LeagueSummary } from '../types/api';

/**
 * Hook for managing league-specific localStorage operations
 * Contains business logic for league persistence
 */
export function useLeagueStorage() {
  const saveSelectedLeague = useCallback((league: LeagueSummary | null): void => {
    if (league) {
      localStorage.set(STORAGE_KEYS.SELECTED_LEAGUE, league);
    } else {
      localStorage.remove(STORAGE_KEYS.SELECTED_LEAGUE);
    }
  }, []);

  const loadSelectedLeague = useCallback((): LeagueSummary | null => {
    return localStorage.get<LeagueSummary>(STORAGE_KEYS.SELECTED_LEAGUE);
  }, []);

  const clearSelectedLeague = useCallback((): void => {
    localStorage.remove(STORAGE_KEYS.SELECTED_LEAGUE);
  }, []);

  const hasSelectedLeague = useCallback((): boolean => {
    return localStorage.has(STORAGE_KEYS.SELECTED_LEAGUE);
  }, []);

  return {
    saveSelectedLeague,
    loadSelectedLeague,
    clearSelectedLeague,
    hasSelectedLeague,
  };
}