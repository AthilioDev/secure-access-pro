import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, getStoredAuth, loginAdmin, logoutAdmin, AdminUser } from '@/lib/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  user: AdminUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredAuth();
    setAuthState(stored);
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const newAuth = await loginAdmin(username, password);
    setAuthState(newAuth);
  };

  const logout = () => {
    logoutAdmin();
    setAuthState({ isAuthenticated: false, user: null, token: null });
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated: authState.isAuthenticated,
      user: authState.user,
      isLoading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
