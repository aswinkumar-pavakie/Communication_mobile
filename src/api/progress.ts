import { apiClient, unwrap } from '@/lib/api-client';
import type { ApiSuccessResponse, ProgressHistory, ProgressOverview, SkillProgress } from '@/types/api';

export async function fetchProgressOverview(): Promise<ProgressOverview> {
  const response = await apiClient.get<ApiSuccessResponse<ProgressOverview>>('/progress');
  return unwrap(response);
}

export async function fetchProgressSkills(): Promise<SkillProgress[]> {
  const response = await apiClient.get<ApiSuccessResponse<SkillProgress[]>>('/progress/skills');
  return unwrap(response);
}

export async function fetchProgressHistory(): Promise<ProgressHistory> {
  const response = await apiClient.get<ApiSuccessResponse<ProgressHistory>>('/progress/history');
  return unwrap(response);
}
