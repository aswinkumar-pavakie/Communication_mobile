import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { fetchMe, login as loginRequest, logout as logoutRequest } from '@/api/auth';
import type { LoginInput } from '@/api/auth';
import {
  clearPersistedTokens,
  getRefreshToken,
  isAuthRejection,
  loadPersistedTokens,
  persistTokens,
  registerAuthExpiredHandler,
} from '@/lib/api-client';
import { queryClient } from '@/lib/query-client';
import type { UserProfile } from '@/types/api';

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Set when a saved session exists but the server couldn't be reached to restore it. */
  connectionError: boolean;
  /** Re-attempts restoring the saved session (after a connection error). */
  retry: () => void;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const handleAuthExpired = useCallback(() => {
    // Drop every cached screen so the next person to log in never sees this student's data.
    queryClient.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    registerAuthExpiredHandler(handleAuthExpired);
  }, [handleAuthExpired]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setConnectionError(false);
      const hasTokens = await loadPersistedTokens();
      if (hasTokens) {
        try {
          const profile = await fetchMe();
          setUser(profile);
        } catch (err) {
          if (isAuthRejection(err)) {
            // The session really is over (revoked/expired) - back to login.
            await clearPersistedTokens();
          } else {
            // Offline, timeout or server hiccup: keep the saved session and offer a retry,
            // instead of silently logging the student out.
            setConnectionError(true);
          }
        }
      }
      setIsLoading(false);
    })();
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const login = useCallback(async (input: LoginInput) => {
    const result = await loginRequest(input);
    queryClient.clear();
    await persistTokens(result);
    setConnectionError(false);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      // Revoke only this device's session - with no token the backend signs out every device.
      await logoutRequest(getRefreshToken() ?? undefined);
    } catch {
      // Best-effort - the important part is clearing local state either way.
    }
    await clearPersistedTokens();
    queryClient.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, isAuthenticated: user !== null, connectionError, retry, login, logout }),
    [user, isLoading, connectionError, retry, login, logout],
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
