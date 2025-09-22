import { useContext } from 'react';
import { LeagueContext } from '../context/leagueContextDefinition';

export function useLeague() {
  const context = useContext(LeagueContext);
  if (context === undefined) {
    throw new Error('useLeague must be used within a LeagueProvider');
  }
  return context;
}