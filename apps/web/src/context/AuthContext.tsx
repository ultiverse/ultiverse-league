/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, ReactNode } from 'react';

export interface AuthContextType {
  email: string | null;
  login: (email: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'ultiverse_user_email';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load email from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      setEmail(stored);
    }
    setIsLoading(false);
  }, []);

  const login = async (userEmail: string) => {
    // Set email in state and sessionStorage FIRST before API call
    setEmail(userEmail);
    sessionStorage.setItem(AUTH_STORAGE_KEY, userEmail);

    // Call the API to create/update the account
    try {
      await fetch('/api/v1/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });
    } catch (error) {
      console.error('Failed to create account:', error);
      // Continue anyway - email is already set in sessionStorage
    }
  };

  const logout = () => {
    setEmail(null);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const value = {
    email,
    login,
    logout,
    isAuthenticated: !!email,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
