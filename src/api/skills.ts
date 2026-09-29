import { apiClient, unwrap } from '@/lib/api-client';
import type { ApiSuccessResponse, Skill } from '@/types/api';

export async function fetchSkills(): Promise<Skill[]> {
  const response = await apiClient.get<ApiSuccessResponse<Skill[]>>('/skills');
  return unwrap(response);
}
