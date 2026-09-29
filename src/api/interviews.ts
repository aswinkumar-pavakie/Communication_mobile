import { apiClient, unwrap } from '@/lib/api-client';
import type {
  ApiSuccessResponse,
  Interview,
  InterviewAnswer,
  InterviewAttemptHistoryItem,
  InterviewQuestion,
  PaginatedResult,
} from '@/types/api';

export async function fetchInterviews(): Promise<PaginatedResult<Interview>> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedResult<Interview>>>('/interviews');
  return unwrap(response);
}

export async function fetchInterview(id: string): Promise<Interview> {
  const response = await apiClient.get<ApiSuccessResponse<Interview>>(`/interviews/${id}`);
  return unwrap(response);
}

export interface StartInterviewResult {
  attemptId: string;
  question: InterviewQuestion;
}

export async function startInterview(interviewId: string): Promise<StartInterviewResult> {
  const response = await apiClient.post<ApiSuccessResponse<StartInterviewResult>>(
    `/interviews/${interviewId}/start`,
  );
  return unwrap(response);
}

export interface SubmitAnswerResult {
  answer: InterviewAnswer;
  nextQuestion: InterviewQuestion | null;
}

export async function submitInterviewAnswer(
  interviewId: string,
  attemptId: string,
  questionId: string,
  answerText: string,
): Promise<SubmitAnswerResult> {
  const response = await apiClient.post<ApiSuccessResponse<SubmitAnswerResult>>(
    `/interviews/${interviewId}/answers`,
    { attemptId, questionId, answerText },
  );
  return unwrap(response);
}

export interface InterviewAttemptSummary {
  id: string;
  status: string;
  overallScore: number | null;
  completedAt: string | null;
}

export async function completeInterview(interviewId: string, attemptId: string): Promise<InterviewAttemptSummary> {
  const response = await apiClient.post<ApiSuccessResponse<InterviewAttemptSummary>>(
    `/interviews/${interviewId}/complete`,
    { attemptId },
  );
  return unwrap(response);
}

export interface InterviewResult extends InterviewAttemptSummary {
  answers: (InterviewAnswer & { question: InterviewQuestion })[];
}

export async function fetchInterviewResult(interviewId: string): Promise<InterviewResult> {
  const response = await apiClient.get<ApiSuccessResponse<InterviewResult>>(`/interviews/${interviewId}/result`);
  return unwrap(response);
}

/** The student's attempts at one interview (newest first) with every Q&A; unfinished ones can be resumed. */
export async function fetchInterviewAttempts(interviewId: string): Promise<PaginatedResult<InterviewAttemptHistoryItem>> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedResult<InterviewAttemptHistoryItem>>>(
    `/interviews/${interviewId}/attempts`,
    { params: { limit: 30 } },
  );
  return unwrap(response);
}
