import { apiClient, unwrap } from '@/lib/api-client';
import type { ApiSuccessResponse, DashboardResponse } from '@/types/api';

export async function fetchDashboard(): Promise<DashboardResponse> {
  const response = await apiClient.get<ApiSuccessResponse<DashboardResponse>>('/dashboard');
  return unwrap(response);
}
