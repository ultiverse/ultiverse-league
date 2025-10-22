import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  email: string | null;
  login: (email: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  const login = (userEmail: string) => {
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
