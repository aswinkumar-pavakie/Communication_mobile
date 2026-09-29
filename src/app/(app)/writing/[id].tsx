import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { fetchWritingActivity, submitWriting } from '@/api/writing';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiErrorMessage, ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { ScoreBadge } from '@/components/ui/score-badge';
import { ScreenContainer } from '@/components/ui/screen-container';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import type { WritingSubmission } from '@/types/api';
import { StyleSheet, View } from 'react-native';

export default function WritingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<WritingSubmission | null>(null);

  const { data: activity, isLoading, isError, error: loadError, refetch } = useQuery({
    queryKey: ['writing-activity', id],
    queryFn: () => fetchWritingActivity(id),
  });

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await submitWriting(id, content.trim());
      setSubmission(result);
    } catch (err) {
      setError(apiErrorMessage(err));
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
        <ErrorState message={apiErrorMessage(loadError)} onRetry={refetch} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ThemedText type="title" style={styles.title}>
        {activity.title}
      </ThemedText>
      <Card>
        <ThemedText type="smallBold">Prompt</ThemedText>
        <ThemedText type="small">{activity.prompt}</ThemedText>
      </Card>

      {submission ? (
        <Card style={styles.resultCard}>
          <View style={styles.scoreRow}>
            <ScoreBadge score={submission.overallScore ?? 0} size="large" />
            <ThemedText type="smallBold" style={styles.flex}>
              {submission.feedback?.feedback}
            </ThemedText>
          </View>
          {submission.feedback?.strengths.length ? (
            <View style={styles.section}>
              <ThemedText type="smallBold" themeColor="success">
                Strengths
              </ThemedText>
              {submission.feedback.strengths.map((s, i) => (
                <ThemedText key={i} type="small">
                  • {s}
                </ThemedText>
              ))}
            </View>
          ) : null}
          {submission.feedback?.weaknesses.length ? (
            <View style={styles.section}>
              <ThemedText type="smallBold" themeColor="warning">
                Areas to improve
              </ThemedText>
              {submission.feedback.weaknesses.map((w, i) => (
                <ThemedText key={i} type="small">
                  • {w}
                </ThemedText>
              ))}
            </View>
          ) : null}
        </Card>
      ) : (
        <Card>
          <TextField
            label="Your submission"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={10}
            style={styles.textArea}
            placeholder="Write your response here..."
          />
          {error ? (
            <ThemedText themeColor="danger" type="small">
              {error}
            </ThemedText>
          ) : null}
          <Button label="Submit" onPress={handleSubmit} loading={isSubmitting} disabled={!content.trim()} />
        </Card>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, lineHeight: 32 },
  textArea: { minHeight: 160, textAlignVertical: 'top' },
  resultCard: { gap: Spacing.three },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  section: { gap: Spacing.one },
  flex: { flex: 1 },
});
