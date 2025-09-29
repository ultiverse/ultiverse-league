import { useState, ReactNode } from 'react';
import { LeagueContext } from './leagueContextDefinition';
import { LeagueSummary } from '../api/uc';
import { useLeagueStorage } from '../hooks/useLeagueStorage';

export function LeagueProvider({ children }: { children: ReactNode }) {
  const { loadSelectedLeague, saveSelectedLeague } = useLeagueStorage();

  const [selectedLeague, setSelectedLeagueState] = useState<LeagueSummary | null>(() =>
    loadSelectedLeague()
  );

  const setSelectedLeague = (league: LeagueSummary | null) => {
    setSelectedLeagueState(league);
    saveSelectedLeague(league);
  };

  return (
    <LeagueContext.Provider value={{ selectedLeague, setSelectedLeague }}>
      {children}
    </LeagueContext.Provider>
  );
}