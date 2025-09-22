import { createContext, useContext, useState, ReactNode } from 'react';
import { LeagueSummary } from '../api/uc';

interface LeagueContextType {
  selectedLeague: LeagueSummary | null;
  setSelectedLeague: (league: LeagueSummary | null) => void;
}

const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

export function LeagueProvider({ children }: { children: ReactNode }) {
  const [selectedLeague, setSelectedLeague] = useState<LeagueSummary | null>(null);

  return (
    <LeagueContext.Provider value={{ selectedLeague, setSelectedLeague }}>
      {children}
    </LeagueContext.Provider>
  );
}

export function useLeague() {
  const context = useContext(LeagueContext);
  if (context === undefined) {
    throw new Error('useLeague must be used within a LeagueProvider');
  }
  return context;
}