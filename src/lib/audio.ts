import { setAudioModeAsync } from 'expo-audio';

const MIME_BY_EXTENSION: Record<string, string> = {
  m4a: 'audio/m4a',
  caf: 'audio/x-caf',
  wav: 'audio/wav',
  mp3: 'audio/mpeg',
};

export function extensionAndMimeType(uri: string): { name: string; mimeType: string } {
  const extension = uri.split('.').pop()?.toLowerCase() ?? 'm4a';
  return { name: `recording.${extension}`, mimeType: MIME_BY_EXTENSION[extension] ?? 'audio/m4a' };
}

export function formatDuration(millis: number): string {
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * iOS refuses to record unless the audio session allows it (expo-audio throws
 * RecordingDisabledException), so switch it on right before recording. playsInSilentMode keeps
 * spoken feedback audible with the ringer switch off.
 */
export async function beginRecordingSession(): Promise<void> {
  await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
}

/**
 * While recording is allowed, iOS routes playback to the quiet earpiece - switch it back off
 * after each recording so "Play spoken feedback" comes out of the speaker.
 */
export async function endRecordingSession(): Promise<void> {
  await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
}
