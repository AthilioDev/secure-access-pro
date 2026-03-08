import { supabase } from "@/integrations/supabase/client";

export interface AdminUser {
  id: string;
  username: string;
  role: string;
  plan: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AdminUser | null;
  token: string | null;
}

const AUTH_STORAGE_KEY = 'auth_guard_admin';
const SESSION_EXPIRY_KEY = 'auth_session_expiry';
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

export const getStoredAuth = (): AuthState => {
  try {
    const expiry = sessionStorage.getItem(SESSION_EXPIRY_KEY);
    if (expiry && Date.now() > parseInt(expiry)) {
      clearStoredAuth();
      return { isAuthenticated: false, user: null, token: null };
    }
    const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* Invalid stored data */ }
  return { isAuthenticated: false, user: null, token: null };
};

export const setStoredAuth = (auth: AuthState): void => {
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  sessionStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + SESSION_DURATION).toString());
};

export const clearStoredAuth = (): void => {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(SESSION_EXPIRY_KEY);
};

export const refreshSessionExpiry = (): void => {
  sessionStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + SESSION_DURATION).toString());
};

export const loginAdmin = async (username: string, password: string): Promise<AuthState> => {
  const { data, error } = await supabase.functions.invoke('admin-auth', {
    body: { username, password, action: 'login' }
  });

  if (error || !data?.success) {
    throw new Error(data?.error || error?.message || 'Login failed');
  }

  const authState: AuthState = {
    isAuthenticated: true,
    user: data.user,
    token: data.token
  };

  setStoredAuth(authState);
  return authState;
};

export const registerUser = async (username: string, password: string, email: string): Promise<AuthState> => {
  const { data, error } = await supabase.functions.invoke('admin-auth', {
    body: { username, password, email, action: 'register' }
  });

  if (error || !data?.success) {
    throw new Error(data?.error || error?.message || 'Registration failed');
  }

  const authState: AuthState = {
    isAuthenticated: true,
    user: data.user,
    token: data.token
  };

  setStoredAuth(authState);
  return authState;
};

export const logoutAdmin = (): void => {
  clearStoredAuth();
};

export const getPlanLimits = (plan: string): number => {
  switch (plan) {
    case 'master_plus': return -1;
    case 'master': return 50;
    case 'standard':
    default: return 5;
  }
};

export const getPlanLabel = (plan: string): string => {
  switch (plan) {
    case 'master_plus': return 'Master++';
    case 'master': return 'Master';
    case 'standard':
    default: return 'Padrão';
  }
};

export const getRoleLabel = (role: string): string => {
  switch (role) {
    case 'master_plus': return 'Owner';
    case 'master': return 'Admin Master';
    case 'admin': return 'Admin';
    case 'staff':
    default: return 'Staff';
  }
};

export const generateLicenseKey = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `ATHILIO-${segment()}-${segment()}-${segment()}-${segment()}`;
};
