import { useState, useEffect, ReactNode } from 'react';
import { UserContext } from './userContextDefinition';
import { UserProfile } from '@ultiverse/shared-types';
import { getCurrentUser } from '../api/uc';

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const userData = await getCurrentUser();

        // If API returns empty firstName/lastName, provide some mock data for testing
        if (userData && (!userData.firstName || !userData.lastName)) {
          userData.firstName = 'Greg';
          userData.lastName = 'Pike';
        }

        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        // For testing without login, provide mock user data
        setUser({
          email: 'greg@gregpike.ca',
          firstName: 'Greg',
          lastName: 'Pike',
          integration: 'native',
          pastTeams: [],
          lastLogin: new Date().toISOString(),
          identifies: 'not_defined',
          avatarSmall: undefined,
          avatarLarge: undefined,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, isLoading, setIsLoading }}>
      {children}
    </UserContext.Provider>
  );
}