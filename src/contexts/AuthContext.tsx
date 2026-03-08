import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, getStoredAuth, loginAdmin, logoutAdmin, registerUser, refreshSessionExpiry, AdminUser } from '@/lib/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  user: AdminUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email: string) => Promise<void>;
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

  // Refresh session on activity
  useEffect(() => {
    if (!authState.isAuthenticated) return;
    const handler = () => refreshSessionExpiry();
    window.addEventListener('click', handler);
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('keydown', handler);
    };
  }, [authState.isAuthenticated]);

  const login = async (username: string, password: string) => {
    const newAuth = await loginAdmin(username, password);
    setAuthState(newAuth);
  };

  const register = async (username: string, password: string, email: string) => {
    const newAuth = await registerUser(username, password, email);
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
      register,
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
