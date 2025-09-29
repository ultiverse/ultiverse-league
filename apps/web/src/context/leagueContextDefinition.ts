import { createContext } from 'react';
import { LeagueContextType } from '../types/context';

export const LeagueContext = createContext<LeagueContextType | undefined>(undefined);