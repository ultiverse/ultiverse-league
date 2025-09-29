import { UserProfile } from '@ultiverse/shared-types';
import { LeagueSummary } from './api';

export interface UserContextType {
    user: UserProfile | null;
    setUser: (user: UserProfile | null) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

export interface LeagueContextType {
    selectedLeague: LeagueSummary | null;
    setSelectedLeague: (league: LeagueSummary | null) => void;
}