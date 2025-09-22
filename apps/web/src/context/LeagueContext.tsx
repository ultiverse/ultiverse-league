import { useState, ReactNode } from 'react';
import { LeagueContext } from './leagueContextDefinition';
import { LeagueSummary } from '../api/uc';

export function LeagueProvider({ children }: { children: ReactNode }) {
  const [selectedLeague, setSelectedLeague] = useState<LeagueSummary | null>(null);

  return (
    <LeagueContext.Provider value={{ selectedLeague, setSelectedLeague }}>
      {children}
    </LeagueContext.Provider>
  );
}