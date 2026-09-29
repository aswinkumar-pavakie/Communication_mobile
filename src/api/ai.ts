import { apiClient, unwrap } from '@/lib/api-client';
import type { ApiSuccessResponse, ChatMessage } from '@/types/api';

export interface ConversationInput {
  conversationId?: string;
  message: string;
  activityId?: string;
}

export interface ConversationResult {
  conversationId: string;
  message: ChatMessage;
}

export async function sendConversationMessage(input: ConversationInput): Promise<ConversationResult> {
  const response = await apiClient.post<ApiSuccessResponse<ConversationResult>>('/ai/conversation', input);
  return unwrap(response);
}
