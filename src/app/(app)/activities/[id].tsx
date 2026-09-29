import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { fetchActivity, submitActivityAttempt } from '@/api/activities';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiErrorMessage, ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { ScoreBadge } from '@/components/ui/score-badge';
import { ScreenContainer } from '@/components/ui/screen-container';
import { TextField } from '@/components/ui/text-field';
import { VoiceRecorderPanel } from '@/components/voice-recorder-panel';
import { Spacing } from '@/constants/theme';
import type { AttemptResult } from '@/types/api';

const VOICE_ELIGIBLE_TYPES = new Set(['SPEAKING', 'INTERVIEW', 'ROLEPLAY']);

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);

  const { data: activity, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['activity', id],
    queryFn: () => fetchActivity(id),
  });

  async function handleTextSubmit() {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const attemptResult = await submitActivityAttempt(id, responseText.trim());
      setResult(attemptResult);
    } catch (err) {
      setSubmitError(apiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingState label="Loading activity..." />
      </ScreenContainer>
    );
  }

  if (isError || !activity) {
    return (
      <ScreenContainer>
        <ErrorState message={apiErrorMessage(error)} onRetry={refetch} />
      </ScreenContainer>
    );
  }

  const supportsVoice = VOICE_ELIGIBLE_TYPES.has(activity.type);

  return (
    <ScreenContainer>
      <ThemedText type="title" style={styles.title}>
        {activity.title}
      </ThemedText>
      <ThemedText themeColor="textSecondary">{activity.description}</ThemedText>
      {activity.instructions ? (
        <Card>
          <ThemedText type="smallBold">Instructions</ThemedText>
          <ThemedText type="small">{activity.instructions}</ThemedText>
        </Card>
      ) : null}

      {result ? (
        <ResultCard result={result} />
      ) : (
        <>
          {supportsVoice ? (
            <View style={styles.modeSwitch}>
              <Button
                label="Type answer"
                variant={mode === 'text' ? 'primary' : 'secondary'}
                onPress={() => setMode('text')}
                style={styles.modeButton}
              />
              <Button
                label="Record answer"
                variant={mode === 'voice' ? 'primary' : 'secondary'}
                onPress={() => setMode('voice')}
                style={styles.modeButton}
              />
            </View>
          ) : null}

          {mode === 'text' ? (
            <Card>
              <TextField
                label="Your response"
                value={responseText}
                onChangeText={setResponseText}
                multiline
                numberOfLines={6}
                style={styles.textArea}
                placeholder="Write your response here..."
              />
              {submitError ? (
                <ThemedText themeColor="danger" type="small">
                  {submitError}
                </ThemedText>
              ) : null}
              <Button
                label="Submit"
                onPress={handleTextSubmit}
                loading={isSubmitting}
                disabled={responseText.trim().length === 0}
              />
            </Card>
          ) : (
            <VoiceRecorderPanel activityId={activity.id} onResult={setResult} />
          )}
        </>
      )}
    </ScreenContainer>
  );
}

function ResultCard({ result }: { result: AttemptResult }) {
  return (
    <Card style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <ScoreBadge score={result.assessment.overallScore} size="large" />
        <ThemedText type="smallBold" style={styles.flex}>
          {result.assessment.feedback}
        </ThemedText>
      </View>

      {result.assessment.strengths.length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="success">
            Strengths
          </ThemedText>
          {result.assessment.strengths.map((s, i) => (
            <ThemedText key={i} type="small">
              • {s}
            </ThemedText>
          ))}
        </View>
      ) : null}

      {result.assessment.weaknesses.length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="warning">
            Areas to improve
          </ThemedText>
          {result.assessment.weaknesses.map((w, i) => (
            <ThemedText key={i} type="small">
              • {w}
            </ThemedText>
          ))}
        </View>
      ) : null}

      {result.assessment.suggestedResponse ? (
        <View style={styles.section}>
          <ThemedText type="smallBold">Suggested response</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {result.assessment.suggestedResponse}
          </ThemedText>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, lineHeight: 32 },
  modeSwitch: { flexDirection: 'row', gap: Spacing.two },
  modeButton: { flex: 1 },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  resultCard: { gap: Spacing.three },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  section: { gap: Spacing.one },
  flex: { flex: 1 },
});
