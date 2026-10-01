import { apiClient, unwrap } from '@/lib/api-client';
import type { ApiSuccessResponse, AssessmentResult, ActivityAttempt, PronunciationResult } from '@/types/api';

export interface AudioFile {
  uri: string;
  name: string;
  mimeType: string;
}

function toFormData(audio: AudioFile, extraFields?: Record<string, string>): FormData {
  const form = new FormData();
  // React Native's FormData accepts this { uri, name, type } shape for file parts -
  // it is not a real Blob/File, but RN's networking layer knows how to stream it.
  form.append('audio', {
    uri: audio.uri,
    name: audio.name,
    type: audio.mimeType,
  } as unknown as Blob);
  if (extraFields) {
    for (const [key, value] of Object.entries(extraFields)) {
      form.append(key, value);
    }
  }
  return form;
}

export interface TranscribeResult {
  transcript: string;
  language?: string;
  durationSeconds?: number;
  confidence?: number;
}

export async function transcribeAudio(audio: AudioFile): Promise<TranscribeResult> {
  const response = await apiClient.post<ApiSuccessResponse<TranscribeResult>>(
    '/voice/transcribe',
    toFormData(audio),
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return unwrap(response);
}

export interface SynthesizeResult {
  audioBase64: string;
  format: string;
  durationSeconds?: number;
}

export async function synthesizeSpeech(text: string): Promise<SynthesizeResult> {
  const response = await apiClient.post<ApiSuccessResponse<SynthesizeResult>>('/voice/synthesize', { text });
  return unwrap(response);
}

export interface VoiceAnalyzeResult {
  attempt: ActivityAttempt;
  assessment: AssessmentResult;
  transcript: string;
  /** Null when the recording had too little speech to score. */
  pronunciation: PronunciationResult | null;
  /** Null when text-to-speech was unavailable (e.g. daily quota) - written feedback is still complete. */
  audioFeedback: SynthesizeResult | null;
}

export async function analyzeVoice(activityId: string, audio: AudioFile): Promise<VoiceAnalyzeResult> {
  const response = await apiClient.post<ApiSuccessResponse<VoiceAnalyzeResult>>(
    '/voice/analyze',
    toFormData(audio, { activityId }),
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return unwrap(response);
}
