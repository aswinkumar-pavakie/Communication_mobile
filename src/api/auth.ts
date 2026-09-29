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
