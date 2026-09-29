import { apiClient, unwrap } from '@/lib/api-client';
import type { ApiSuccessResponse, PaginatedResult, Report } from '@/types/api';

export async function fetchReports(): Promise<PaginatedResult<Report>> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedResult<Report>>>('/reports');
  return unwrap(response);
}

export async function fetchReport(id: string): Promise<Report> {
  const response = await apiClient.get<ApiSuccessResponse<Report>>(`/reports/${id}`);
  return unwrap(response);
}
