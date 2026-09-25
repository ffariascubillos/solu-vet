import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { setOnSessionExpired } from '@/src/services/api';
import {
  clearSession,
  clearTokens,
  getSession,
  getTokens,
  setSession as persistSession,
  setTokens,
} from '@/src/services/token-storage';

import * as authApi from '../api/auth.api';

import type { AuthOrganization, AuthSessionData, AuthUser } from '../types/auth.types';

type AuthContextValue = {
  user: AuthUser | null;
  organization: AuthOrganization | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setSession: (data: AuthSessionData) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organization, setOrganization] = useState<AuthOrganization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function hydrate() {
      const tokens = await getTokens();
      const session = await getSession();

      if (tokens && session) {
        setUser(session.user);
        setOrganization(session.organization);
      }

      setIsLoading(false);
    }

    hydrate();
  }, []);

  useEffect(() => {
    setOnSessionExpired(() => {
      clearAll();
    });
  }, []);

  function clearAll() {
    setUser(null);
    setOrganization(null);
  }

  async function setSession(data: AuthSessionData) {
    await setTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
    await persistSession({ user: data.user, organization: data.organization });
    setUser(data.user);
    setOrganization(data.organization);
  }

  async function logout() {
    const tokens = await getTokens();

    if (tokens?.refreshToken) {
      try {
        await authApi.logout(tokens.refreshToken);
      } catch {}
    }

    await clearTokens();
    await clearSession();
    clearAll();
  }

  async function logoutAll() {
    try {
      await authApi.logoutAll();
    } catch {}

    await clearTokens();
    await clearSession();
    clearAll();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        isLoading,
        isAuthenticated: !!user,
        setSession,
        logout,
        logoutAll,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider.');
  }

  return context;
}
