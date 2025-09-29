import { createContext } from 'react';
import { UserContextType } from '../types/context';

// Re-export for backward compatibility
export { UserContextType };

export const UserContext = createContext<UserContextType | undefined>(undefined);