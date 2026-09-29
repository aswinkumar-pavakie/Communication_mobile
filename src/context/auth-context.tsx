import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { fetchMe, login as loginRequest, logout as logoutRequest } from '@/api/auth';
import type { LoginInput } from '@/api/auth';
import {
  clearPersistedTokens,
  loadPersistedTokens,
  persistTokens,
  registerAuthExpiredHandler,
} from '@/lib/api-client';
import type { UserProfile } from '@/types/api';

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleAuthExpired = useCallback(() => {
    setUser(null);
  }, []);

  useEffect(() => {
    registerAuthExpiredHandler(handleAuthExpired);
  }, [handleAuthExpired]);

  useEffect(() => {
    (async () => {
      const hasTokens = await loadPersistedTokens();
      if (hasTokens) {
        try {
          const profile = await fetchMe();
          setUser(profile);
        } catch {
          await clearPersistedTokens();
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const result = await loginRequest(input);
    await persistTokens(result);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Best-effort - the important part is clearing local state either way.
    }
    await clearPersistedTokens();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, isAuthenticated: user !== null, login, logout }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
