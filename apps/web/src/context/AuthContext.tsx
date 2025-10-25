import React, { createContext, useState, useEffect, ReactNode } from 'react';

export interface AuthContextType {
  email: string | null;
  login: (email: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'ultiverse_user_email';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);

  // Load email from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      setEmail(stored);
    }
  }, []);

  const login = async (userEmail: string) => {
    // Call the API to create/update the account
    try {
      await fetch('/api/v1/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });
    } catch (error) {
      console.error('Failed to create account:', error);
      // Continue anyway - we'll create the account later if needed
    }

    setEmail(userEmail);
    sessionStorage.setItem(AUTH_STORAGE_KEY, userEmail);
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
