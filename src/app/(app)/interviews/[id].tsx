import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  completeInterview,
  fetchInterview,
  startInterview,
  submitInterviewAnswer,
  type InterviewAttemptSummary,
} from '@/api/interviews';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiErrorMessage, ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { ScoreBadge } from '@/components/ui/score-badge';
import { ScreenContainer } from '@/components/ui/screen-container';
import { TextField } from '@/components/ui/text-field';
import { VoiceToTextButton } from '@/components/voice-to-text-button';
import type { InterviewQuestion } from '@/types/api';

type Phase =
  | { kind: 'intro' }
  | { kind: 'active'; attemptId: string; question: InterviewQuestion; lastScore?: number }
  | { kind: 'completed'; summary: InterviewAttemptSummary };

export default function InterviewFlowScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [phase, setPhase] = useState<Phase>({ kind: 'intro' });
  const [answerText, setAnswerText] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: interview, isLoading, isError, error: loadError, refetch } = useQuery({
    queryKey: ['interview', id],
    queryFn: () => fetchInterview(id),
  });

  async function handleStart() {
    setError(null);
    setIsBusy(true);
    try {
      const { attemptId, question } = await startInterview(id);
      setPhase({ kind: 'active', attemptId, question });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSubmitAnswer() {
    if (phase.kind !== 'active') return;
    setError(null);
    setIsBusy(true);
    try {
      const { answer, nextQuestion } = await submitInterviewAnswer(
        id,
        phase.attemptId,
        phase.question.id,
        answerText.trim(),
      );
      setAnswerText('');
      if (nextQuestion) {
        setPhase({ kind: 'active', attemptId: phase.attemptId, question: nextQuestion, lastScore: answer.score ?? undefined });
      } else {
        const summary = await completeInterview(id, phase.attemptId);
        setPhase({ kind: 'completed', summary });
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingState label="Loading interview..." />
      </ScreenContainer>
    );
  }

  if (isError || !interview) {
    return (
      <ScreenContainer>
        <ErrorState message={apiErrorMessage(loadError)} onRetry={refetch} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ThemedText type="title" style={styles.title}>
        {interview.title}
      </ThemedText>

      {phase.kind === 'intro' ? (
        <>
          <ThemedText themeColor="textSecondary">{interview.description}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {interview.totalQuestions ?? '?'} questions • ~{interview.durationMinutes} min
          </ThemedText>
          {error ? (
            <ThemedText themeColor="danger" type="small">
              {error}
            </ThemedText>
          ) : null}
          <Button label="Start interview" onPress={handleStart} loading={isBusy} />
        </>
      ) : null}

      {phase.kind === 'active' ? (
        <>
          {phase.lastScore != null ? (
            <Card>
              <ThemedText type="small" themeColor="textSecondary">
                Previous answer scored {Math.round(phase.lastScore)}/100
              </ThemedText>
            </Card>
          ) : null}
          <Card>
            <ThemedText type="small" themeColor="textSecondary">
              Question {phase.question.order}
            </ThemedText>
            <ThemedText type="smallBold">{phase.question.questionText}</ThemedText>
          </Card>
          <VoiceToTextButton
            onTranscript={(text) => setAnswerText((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text))}
            disabled={isBusy}
          />
          <TextField
            label="Your answer"
            value={answerText}
            onChangeText={setAnswerText}
            multiline
            numberOfLines={6}
            style={styles.textArea}
            placeholder="Answer as you would in a real interview, or use the mic above..."
          />
          {error ? (
            <ThemedText themeColor="danger" type="small">
              {error}
            </ThemedText>
          ) : null}
          <Button
            label="Submit answer"
            onPress={handleSubmitAnswer}
            loading={isBusy}
            disabled={answerText.trim().length === 0}
          />
        </>
      ) : null}

      {phase.kind === 'completed' ? (
        <Card style={styles.completedCard}>
          <View style={styles.scoreRow}>
            <ScoreBadge score={phase.summary.overallScore ?? 0} size="large" />
            <ThemedText type="smallBold">Interview complete!</ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            Great work. Check your Progress tab to see how this affected your interview skill score.
          </ThemedText>
        </Card>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, lineHeight: 32 },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  completedCard: { gap: 12, alignItems: 'center' },
  scoreRow: { alignItems: 'center', gap: 10 },
});
