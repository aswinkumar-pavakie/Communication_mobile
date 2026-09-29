import { apiClient, unwrap } from '@/lib/api-client';
import type {
  ApiSuccessResponse,
  ChatMessage,
  Debate,
  DebatePosition,
  DebateSessionHistoryItem,
  PaginatedResult,
} from '@/types/api';

export async function fetchDebates(): Promise<PaginatedResult<Debate>> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedResult<Debate>>>('/debates');
  return unwrap(response);
}

export async function fetchDebate(id: string): Promise<Debate> {
  const response = await apiClient.get<ApiSuccessResponse<Debate>>(`/debates/${id}`);
  return unwrap(response);
}

export interface DebateSessionSummary {
  id: string;
  status: string;
  overallScore: number | null;
  /** Stored assessment JSON - present once the session is completed. */
  feedback?: unknown;
}

export async function startDebateSession(
  debateId: string,
  position: DebatePosition,
): Promise<{ session: DebateSessionSummary; message: ChatMessage }> {
  const response = await apiClient.post<ApiSuccessResponse<{ session: DebateSessionSummary; message: ChatMessage }>>(
    `/debates/${debateId}/sessions`,
    { position },
  );
  return unwrap(response);
}

export async function sendDebateArgument(
  debateId: string,
  sessionId: string,
  message: string,
): Promise<ChatMessage> {
  const response = await apiClient.post<ApiSuccessResponse<ChatMessage>>(`/debates/${debateId}/arguments`, {
    sessionId,
    message,
  });
  return unwrap(response);
}

export async function completeDebateSession(debateId: string, sessionId: string): Promise<DebateSessionSummary> {
  const response = await apiClient.post<ApiSuccessResponse<DebateSessionSummary>>(
    `/debates/${debateId}/complete`,
    { sessionId },
  );
  return unwrap(response);
}

export interface DebateSessionDetail extends DebateSessionSummary {
  messages: ChatMessage[];
  debate: Debate;
  studentPosition: DebatePosition;
}

export async function fetchDebateSession(sessionId: string): Promise<DebateSessionDetail> {
  const response = await apiClient.get<ApiSuccessResponse<DebateSessionDetail>>(`/debates/sessions/${sessionId}`);
  return unwrap(response);
}

/** The student's debates on one topic (newest first), including unfinished ones. */
export async function fetchDebateSessions(debateId: string): Promise<PaginatedResult<DebateSessionHistoryItem>> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedResult<DebateSessionHistoryItem>>>(
    `/debates/${debateId}/sessions`,
    { params: { limit: 30 } },
  );
  return unwrap(response);
}
