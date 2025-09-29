import { useState, ReactNode } from 'react';
import { LeagueContext } from './leagueContextDefinition';
import { LeagueSummary } from '../api/uc';
import { leagueStorage } from '../utils/localStorage.util';

export function LeagueProvider({ children }: { children: ReactNode }) {
  const [selectedLeague, setSelectedLeagueState] = useState<LeagueSummary | null>(() =>
    leagueStorage.loadSelectedLeague()
  );

  const setSelectedLeague = (league: LeagueSummary | null) => {
    setSelectedLeagueState(league);
    leagueStorage.saveSelectedLeague(league);
  };

  return (
    <LeagueContext.Provider value={{ selectedLeague, setSelectedLeague }}>
      {children}
    </LeagueContext.Provider>
  );
}