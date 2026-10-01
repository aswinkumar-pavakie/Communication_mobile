import { apiClient, unwrap } from '@/lib/api-client';
import type { ApiSuccessResponse, AuthResponse, UserProfile } from '@/types/api';

export interface LoginInput {
  email: string;
  password: string;
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const response = await apiClient.post<ApiSuccessResponse<AuthResponse>>('/auth/login', input);
  return unwrap(response);
}

export async function logout(refreshToken?: string): Promise<void> {
  await apiClient.post('/auth/logout', refreshToken ? { refreshToken } : {});
}

export async function fetchMe(): Promise<UserProfile> {
  const response = await apiClient.get<ApiSuccessResponse<UserProfile>>('/auth/me');
  return unwrap(response);
}

/** Emails a 6-digit reset code. Resolves the same way whether or not the email has an account. */
export async function requestPasswordReset(email: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { email });
}

export async function resetPassword(input: { email: string; code: string; newPassword: string }): Promise<void> {
  await apiClient.post('/auth/reset-password', input);
}

/** Returns fresh tokens for this device (other devices are signed out). */
export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ accessToken: string; refreshToken: string }> {
  const response = await apiClient.post<ApiSuccessResponse<{ accessToken: string; refreshToken: string }>>(
    '/auth/change-password',
    input,
  );
  return unwrap(response);
}
