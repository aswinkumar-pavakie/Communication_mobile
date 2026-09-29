import { apiClient, unwrap } from '@/lib/api-client';
import type { ApiSuccessResponse, ChatMessage, ChatSessionHistoryItem, PaginatedResult, Roleplay } from '@/types/api';

export async function fetchRoleplays(): Promise<PaginatedResult<Roleplay>> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedResult<Roleplay>>>('/roleplays');
  return unwrap(response);
}

export async function fetchRoleplay(id: string): Promise<Roleplay> {
  const response = await apiClient.get<ApiSuccessResponse<Roleplay>>(`/roleplays/${id}`);
  return unwrap(response);
}

export interface RoleplaySessionSummary {
  id: string;
  status: string;
  overallScore: number | null;
  /** Stored assessment JSON - present once the session is completed. */
  feedback?: unknown;
}

export async function startRoleplaySession(
  roleplayId: string,
): Promise<{ session: RoleplaySessionSummary; message: ChatMessage }> {
  const response = await apiClient.post<ApiSuccessResponse<{ session: RoleplaySessionSummary; message: ChatMessage }>>(
    `/roleplays/${roleplayId}/sessions`,
  );
  return unwrap(response);
}

export async function sendRoleplayMessage(
  roleplayId: string,
  sessionId: string,
  message: string,
): Promise<ChatMessage> {
  const response = await apiClient.post<ApiSuccessResponse<ChatMessage>>(`/roleplays/${roleplayId}/messages`, {
    sessionId,
    message,
  });
  return unwrap(response);
}

export async function completeRoleplaySession(
  roleplayId: string,
  sessionId: string,
): Promise<RoleplaySessionSummary> {
  const response = await apiClient.post<ApiSuccessResponse<RoleplaySessionSummary>>(
    `/roleplays/${roleplayId}/complete`,
    { sessionId },
  );
  return unwrap(response);
}

export interface RoleplaySessionDetail extends RoleplaySessionSummary {
  messages: ChatMessage[];
  roleplay: Roleplay;
}

export async function fetchRoleplaySession(sessionId: string): Promise<RoleplaySessionDetail> {
  const response = await apiClient.get<ApiSuccessResponse<RoleplaySessionDetail>>(
    `/roleplays/sessions/${sessionId}`,
  );
  return unwrap(response);
}

/** The student's conversations for one scenario (newest first), including unfinished ones. */
export async function fetchRoleplaySessions(roleplayId: string): Promise<PaginatedResult<ChatSessionHistoryItem>> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedResult<ChatSessionHistoryItem>>>(
    `/roleplays/${roleplayId}/sessions`,
    { params: { limit: 30 } },
  );
  return unwrap(response);
}
