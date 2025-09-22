import { createContext } from 'react';
import { UserProfile } from '@ultiverse/shared-types';

export interface UserContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);