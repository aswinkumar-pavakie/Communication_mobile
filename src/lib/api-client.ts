import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/config/env';
import { secureStorage, STORAGE_KEYS } from '@/lib/storage';
import type { ApiSuccessResponse, AuthResponse } from '@/types/api';

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshPromise: Promise<string> | null = null;
let onAuthExpired: (() => void) | null = null;

/** AuthProvider calls this once, at mount, to hear about unrecoverable auth failures. */
export function registerAuthExpiredHandler(handler: () => void): void {
  onAuthExpired = handler;
}

export function setTokens(next: { accessToken: string; refreshToken: string }): void {
  accessToken = next.accessToken;
  refreshToken = next.refreshToken;
}

export function clearTokens(): void {
  accessToken = null;
  refreshToken = null;
}

/** Restores tokens from secure storage into memory - call once before first render. */
export async function loadPersistedTokens(): Promise<boolean> {
  const [storedAccess, storedRefresh] = await Promise.all([
    secureStorage.getItem(STORAGE_KEYS.accessToken),
    secureStorage.getItem(STORAGE_KEYS.refreshToken),
  ]);
  if (storedAccess && storedRefresh) {
    accessToken = storedAccess;
    refreshToken = storedRefresh;
    return true;
  }
  return false;
}

export async function persistTokens(tokens: { accessToken: string; refreshToken: string }): Promise<void> {
  setTokens(tokens);
  await Promise.all([
    secureStorage.setItem(STORAGE_KEYS.accessToken, tokens.accessToken),
    secureStorage.setItem(STORAGE_KEYS.refreshToken, tokens.refreshToken),
  ]);
}

export async function clearPersistedTokens(): Promise<void> {
  clearTokens();
  await Promise.all([
    secureStorage.removeItem(STORAGE_KEYS.accessToken),
    secureStorage.removeItem(STORAGE_KEYS.refreshToken),
  ]);
}

// eslint-disable-next-line import/no-named-as-default-member -- axios.create is the standard API
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
});

apiClient.interceptors.request.use((config) => {
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

async function refreshAccessToken(): Promise<string> {
  if (!refreshToken) {
    throw new Error('No refresh token available.');
  }
  // A bare axios call (not apiClient) so this request never re-enters the 401 interceptor.
  const response = await axios.post<ApiSuccessResponse<AuthResponse>>(
    `${API_BASE_URL}/auth/refresh`,
    { refreshToken },
  );
  const tokens = response.data.data;
  await persistTokens(tokens);
  return tokens.accessToken;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/register');

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const newAccessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        await clearPersistedTokens();
        onAuthExpired?.();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

/** Unwraps the backend's `{ success, data }` envelope. */
export function unwrap<T>(response: { data: ApiSuccessResponse<T> }): T {
  return response.data.data;
}
