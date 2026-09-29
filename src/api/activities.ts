import { apiClient, unwrap } from '@/lib/api-client';
import type {
  Activity,
  ActivityType,
  ApiSuccessResponse,
  AttemptHistoryItem,
  AttemptResult,
  Difficulty,
  PaginatedResult,
  SkillCode,
} from '@/types/api';

export interface ActivityFilters {
  page?: number;
  limit?: number;
  type?: ActivityType;
  difficulty?: Difficulty;
  skill?: SkillCode;
}

export async function fetchActivities(filters: ActivityFilters = {}): Promise<PaginatedResult<Activity>> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedResult<Activity>>>('/activities', {
    params: filters,
  });
  return unwrap(response);
}

export async function fetchActivity(id: string): Promise<Activity> {
  const response = await apiClient.get<ApiSuccessResponse<Activity>>(`/activities/${id}`);
  return unwrap(response);
}

/** The student's saved answers for one activity, newest first. */
export async function fetchActivityAttempts(
  activityId: string,
  limit = 50,
): Promise<PaginatedResult<AttemptHistoryItem>> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedResult<AttemptHistoryItem>>>(
    `/activities/${activityId}/attempts`,
    { params: { limit } },
  );
  return unwrap(response);
}

export async function submitActivityAttempt(activityId: string, responseText: string): Promise<AttemptResult> {
  const response = await apiClient.post<ApiSuccessResponse<AttemptResult>>(
    `/activities/${activityId}/attempts`,
    { responseText },
  );
  return unwrap(response);
}
