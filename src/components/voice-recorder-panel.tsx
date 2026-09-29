import {
  AudioModule,
  RecordingPresets,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { analyzeVoice } from '@/api/voice';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '@/components/ui/error-state';
import { useTheme } from '@/hooks/use-theme';
import { extensionAndMimeType, formatDuration } from '@/lib/audio';
import type { AttemptResult } from '@/types/api';

interface VoiceRecorderPanelProps {
  activityId: string;
  onResult: (result: AttemptResult) => void;
}

export function VoiceRecorderPanel({ activityId, onResult }: VoiceRecorderPanelProps) {
  const theme = useTheme();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackUri, setFeedbackUri] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const feedbackPlayer = useAudioPlayer(feedbackUri ?? undefined);

  useEffect(() => {
    AudioModule.requestRecordingPermissionsAsync().then((status) => {
      if (!status.granted) {
        setError('Microphone permission is required to record your answer.');
      }
    });
  }, []);

  async function handleStart() {
    setError(null);
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      setError('Could not start recording. Check microphone permission and try again.');
    }
  }

  async function handleStopAndSubmit() {
    setError(null);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) {
        setError('Recording failed - no audio was captured.');
        return;
      }

      setIsProcessing(true);
      const { name, mimeType } = extensionAndMimeType(uri);
      const analysis = await analyzeVoice(activityId, { uri, name, mimeType });

      setTranscript(analysis.transcript);

      const feedbackFile = new File(Paths.cache, `feedback-${Date.now()}.${analysis.audioFeedback.format}`);
      feedbackFile.create();
      feedbackFile.write(analysis.audioFeedback.audioBase64, { encoding: 'base64' });
      setFeedbackUri(feedbackFile.uri);

      onResult({ attempt: analysis.attempt, assessment: analysis.assessment });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  }

  function handlePlayFeedback() {
    if (!feedbackPlayer) return;
    feedbackPlayer.seekTo(0);
    feedbackPlayer.play();
  }

  return (
    <View style={styles.container}>
      {error ? (
        <ThemedText themeColor="danger" type="small">
          {error}
        </ThemedText>
      ) : null}

      {transcript ? (
        <View style={styles.transcriptBox}>
          <ThemedText type="small" themeColor="textSecondary">
            You said:
          </ThemedText>
          <ThemedText type="small">{transcript}</ThemedText>
          <Button label="Play spoken feedback" onPress={handlePlayFeedback} variant="secondary" />
        </View>
      ) : (
        <View style={styles.recordArea}>
          <View style={[styles.dot, { backgroundColor: recorderState.isRecording ? theme.danger : theme.border }]} />
          <ThemedText type="title" style={styles.timer}>
            {formatDuration(recorderState.durationMillis ?? 0)}
          </ThemedText>

          {!recorderState.isRecording ? (
            <Button label="Start recording" onPress={handleStart} disabled={isProcessing} />
          ) : (
            <Button
              label="Stop & submit"
              onPress={handleStopAndSubmit}
              loading={isProcessing}
              variant="danger"
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  recordArea: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  timer: { fontSize: 36, lineHeight: 42 },
  transcriptBox: { gap: 10 },
});
