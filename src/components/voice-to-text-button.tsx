import {
  AudioModule,
  RecordingPresets,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { transcribeAudio } from '@/api/voice';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '@/components/ui/error-state';
import { useTheme } from '@/hooks/use-theme';
import { beginRecordingSession, endRecordingSession, extensionAndMimeType, formatDuration } from '@/lib/audio';

interface VoiceToTextButtonProps {
  /** Called with the transcribed text once recording stops - the caller decides what
   * to do with it (e.g. fill a TextField so the user can review/edit before sending). */
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

/**
 * Record -> transcribe -> hand the text back to the caller's existing composer.
 * Reuses the same /voice/transcribe endpoint as the Activities voice flow, but stays
 * decoupled from any one feature's submit logic - this is what makes it reusable across
 * interview answers, roleplay messages, and debate arguments, which each have their own
 * separate submission endpoint that already accepts plain text.
 */
export function VoiceToTextButton({ onTranscript, disabled }: VoiceToTextButtonProps) {
  const theme = useTheme();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Synchronous guard: recorderState only updates every ~500ms, so double taps slip through state. */
  const busyRef = useRef(false);

  useEffect(() => {
    AudioModule.requestRecordingPermissionsAsync().then((status) => {
      if (!status.granted) {
        setError('Microphone permission is required to speak your answer.');
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

  async function handleStopAndTranscribe() {
    if (busyRef.current) return;
    busyRef.current = true;
    setError(null);
    setIsTranscribing(true);
    try {
      await recorder.stop();
      await endRecordingSession();
      const uri = recorder.uri;
      if (!uri) {
        setError('Recording failed - no audio was captured.');
        return;
      }

      const { name, mimeType } = extensionAndMimeType(uri);
      const { transcript } = await transcribeAudio({ uri, name, mimeType });
      if (transcript.trim()) onTranscript(transcript.trim());
      else setError("We couldn't hear anything - try again a little closer to the phone.");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsTranscribing(false);
      busyRef.current = false;
    }
  }

  const isBusy = isTranscribing || Boolean(disabled);

  return (
    <View style={styles.container}>
      {error ? (
        <ThemedText themeColor="danger" type="small">
          {error}
        </ThemedText>
      ) : null}

      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: recorderState.isRecording ? theme.danger : theme.border }]} />
        {recorderState.isRecording ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
            {formatDuration(recorderState.durationMillis ?? 0)}
          </ThemedText>
        ) : (
          <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
            Tap to speak your answer instead of typing
          </ThemedText>
        )}

        {!recorderState.isRecording ? (
          <Button label="Speak" onPress={handleStart} disabled={isBusy} variant="secondary" />
        ) : (
          <Button label="Stop" onPress={handleStopAndTranscribe} loading={isTranscribing} variant="danger" />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
