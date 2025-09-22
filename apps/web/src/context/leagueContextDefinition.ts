import { createContext } from 'react';
import { LeagueSummary } from '../api/uc';

export interface LeagueContextType {
  selectedLeague: LeagueSummary | null;
  setSelectedLeague: (league: LeagueSummary | null) => void;
}

export const LeagueContext = createContext<LeagueContextType | undefined>(undefined);