import { AudioModule, RecordingPresets, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { analyzeVoice } from '@/api/voice';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '@/components/ui/error-state';
import { useTheme } from '@/hooks/use-theme';
import { beginRecordingSession, endRecordingSession, extensionAndMimeType, formatDuration } from '@/lib/audio';
import type { AttemptResult, PronunciationResult } from '@/types/api';

interface VoiceRecorderPanelProps {
  activityId: string;
  /** Called once the recording is uploaded, so the screen can show a "transcribing" bubble. */
  onSubmitting?: () => void;
  /** Called with the scored attempt, a local file URI for the spoken feedback, and the pronunciation breakdown. */
  onResult: (result: AttemptResult, feedbackAudioUri: string | null, pronunciation: PronunciationResult | null) => void;
  /** Called when analysis fails - the panel shows the error itself. */
  onError?: () => void;
}

/**
 * Record -> stop & submit. The panel resets after every result, so the student can
 * record another attempt straight away; the screen owns showing the transcript/feedback.
 */
export function VoiceRecorderPanel({ activityId, onSubmitting, onResult, onError }: VoiceRecorderPanelProps) {
  const theme = useTheme();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Synchronous guard: recorderState only updates every ~500ms, so a double tap on Stop could upload twice. */
  const busyRef = useRef(false);

  useEffect(() => {
    AudioModule.requestRecordingPermissionsAsync().then((status) => {
      if (!status.granted) {
        setError('Microphone permission is required to record your answer.');
      }
    });
  }, []);

  async function handleStart() {
    if (busyRef.current) return;
    busyRef.current = true;
    setError(null);
    try {
      await beginRecordingSession();
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      setError('Could not start recording. Check microphone permission and try again.');
    } finally {
      busyRef.current = false;
    }
  }

  async function handleStopAndSubmit() {
    if (busyRef.current) return;
    busyRef.current = true;
    setError(null);
    setIsProcessing(true);
    try {
      await recorder.stop();
      await endRecordingSession();
      const uri = recorder.uri;
      if (!uri) {
        setError('Recording failed - no audio was captured.');
        return;
      }

      onSubmitting?.();
      const { name, mimeType } = extensionAndMimeType(uri);
      const analysis = await analyzeVoice(activityId, { uri, name, mimeType });

      // Spoken feedback is optional - the backend returns null if text-to-speech was unavailable.
      let feedbackUri: string | null = null;
      if (analysis.audioFeedback) {
        const feedbackFile = new File(Paths.cache, `feedback-${Date.now()}.${analysis.audioFeedback.format}`);
        feedbackFile.create();
        feedbackFile.write(analysis.audioFeedback.audioBase64, { encoding: 'base64' });
        feedbackUri = feedbackFile.uri;
      }

      onResult(
        { attempt: analysis.attempt, assessment: analysis.assessment },
        feedbackUri,
        analysis.pronunciation ?? null,
      );
    } catch (err) {
      setError(apiErrorMessage(err));
      onError?.();
    } finally {
      setIsProcessing(false);
      busyRef.current = false;
    }
  }

  return (
    <View style={styles.container}>
      {error ? (
        <ThemedText themeColor="danger" type="small">
          {error}
        </ThemedText>
      ) : null}

      <View style={styles.recordArea}>
        <View style={[styles.dot, { backgroundColor: recorderState.isRecording ? theme.danger : theme.border }]} />
        <ThemedText type="title" style={styles.timer}>
          {formatDuration(recorderState.isRecording ? (recorderState.durationMillis ?? 0) : 0)}
        </ThemedText>

        {!recorderState.isRecording ? (
          <Button
            label={isProcessing ? 'Analysing...' : 'Start recording'}
            onPress={handleStart}
            disabled={isProcessing}
          />
        ) : (
          <Button label="Stop & submit" onPress={handleStopAndSubmit} loading={isProcessing} variant="danger" />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  recordArea: { alignItems: 'center', gap: 12, paddingVertical: 16 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  timer: { fontSize: 36, lineHeight: 42 },
});
