import { apiClient, unwrap } from '@/lib/api-client';
import type { ApiSuccessResponse, PaginatedResult, WritingActivity, WritingSubmission } from '@/types/api';

export async function fetchWritingActivities(): Promise<PaginatedResult<WritingActivity>> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedResult<WritingActivity>>>('/writing');
  return unwrap(response);
}

export async function fetchWritingActivity(id: string): Promise<WritingActivity> {
  const response = await apiClient.get<ApiSuccessResponse<WritingActivity>>(`/writing/${id}`);
  return unwrap(response);
}

export async function submitWriting(id: string, content: string): Promise<WritingSubmission> {
  const response = await apiClient.post<ApiSuccessResponse<WritingSubmission>>(`/writing/${id}/submissions`, {
    content,
  });
  return unwrap(response);
}

export async function fetchWritingSubmissions(id: string): Promise<PaginatedResult<WritingSubmission>> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedResult<WritingSubmission>>>(
    `/writing/${id}/submissions`,
  );
  return unwrap(response);
}
