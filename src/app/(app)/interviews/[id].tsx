import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type ScrollView } from 'react-native';

import {
  completeInterview,
  fetchInterview,
  fetchInterviewAttempts,
  startInterview,
  submitInterviewAnswer,
  type InterviewAttemptSummary,
} from '@/api/interviews';
import {
  CoachBubble,
  FeedbackBubble,
  formatWhen,
  HistoryGroup,
  HistoryHeader,
  parseAssessmentFeedback,
  TypingBubble,
  UserBubble,
  useFoldState,
} from '@/components/activity-chat';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiErrorMessage, ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { ScoreBadge } from '@/components/ui/score-badge';
import { ScreenContainer } from '@/components/ui/screen-container';
import { TextField } from '@/components/ui/text-field';
import { VoiceToTextButton } from '@/components/voice-to-text-button';
import { Spacing } from '@/constants/theme';
import type { AssessmentFeedback, InterviewAttemptHistoryItem, InterviewQuestion } from '@/types/api';

const AI_ICON = 'account-tie-outline';

/** One answered question: what was asked, what the student said, and how it scored. */
interface Turn {
  id: string;
  question: InterviewQuestion;
  answerText: string;
  feedback: AssessmentFeedback | null;
}

type Phase =
  | { kind: 'intro' }
  | { kind: 'active'; attemptId: string; question: InterviewQuestion; turns: Turn[]; resumed: boolean }
  | { kind: 'completed'; summary: InterviewAttemptSummary; turns: Turn[] }
  /** Every question answered (and saved) but closing the attempt failed - offer a retry. */
  | { kind: 'finish'; attemptId: string; turns: Turn[] };

function turnsFrom(attempt: InterviewAttemptHistoryItem): Turn[] {
  return attempt.answers.map((a) => ({
    id: a.id,
    question: a.question,
    answerText: a.answerText ?? '',
    feedback: parseAssessmentFeedback(a.feedback, a.score),
  }));
}

function QuestionBubble({ question }: { question: InterviewQuestion }) {
  return (
    <CoachBubble icon={AI_ICON}>
      <ThemedText type="small" themeColor="textSecondary">
        Question {question.order}
      </ThemedText>
      <ThemedText type="smallBold">{question.questionText}</ThemedText>
    </CoachBubble>
  );
}

function InterviewTurns({ turns }: { turns: Turn[] }) {
  return (
    <>
      {turns.map((turn) => (
        <View key={turn.id} style={styles.turn}>
          <QuestionBubble question={turn.question} />
          <UserBubble text={turn.answerText || '(No answer)'} />
          {turn.feedback ? <FeedbackBubble assessment={turn.feedback} /> : null}
        </View>
      ))}
    </>
  );
}

export default function InterviewFlowScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);

  const [phase, setPhase] = useState<Phase>({ kind: 'intro' });
  const [answerText, setAnswerText] = useState('');
  const [pendingAnswer, setPendingAnswer] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attemptsKey = ['interview-attempts', id];

  const { data: interview, isLoading, isError, error: loadError, refetch } = useQuery({
    queryKey: ['interview', id],
    queryFn: () => fetchInterview(id),
  });
  const attemptsQuery = useQuery({ queryKey: attemptsKey, queryFn: () => fetchInterviewAttempts(id) });
  const attempts = attemptsQuery.data?.items ?? [];
  const unfinished = attempts.find((a) => a.status === 'STARTED');
  const fold = useFoldState(attempts.map((a) => a.id));

  function scrollToEnd() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  }

  function refreshAfterCompletion() {
    void queryClient.invalidateQueries({ queryKey: attemptsKey });
    for (const key of ['dashboard', 'progress-overview', 'progress-history', 'streak-calendar']) {
      void queryClient.invalidateQueries({ queryKey: [key] });
    }
  }

  function backToIntro() {
    void queryClient.invalidateQueries({ queryKey: attemptsKey });
    setError(null);
    setPhase({ kind: 'intro' });
  }

  async function handleStart() {
    setError(null);
    setIsBusy(true);
    try {
      const { attemptId, question } = await startInterview(id);
      setPhase({ kind: 'active', attemptId, question, turns: [], resumed: false });
      void queryClient.invalidateQueries({ queryKey: attemptsKey });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function finish(attemptId: string, turns: Turn[]) {
    const summary = await completeInterview(id, attemptId);
    setPhase({ kind: 'completed', summary, turns });
    refreshAfterCompletion();
  }

  async function handleResume(attempt: InterviewAttemptHistoryItem) {
    setError(null);
    const turns = turnsFrom(attempt);
    if (attempt.nextQuestion) {
      setPhase({ kind: 'active', attemptId: attempt.id, question: attempt.nextQuestion, turns, resumed: true });
      scrollToEnd();
      return;
    }
    // Every question was answered but the attempt never got closed - finish it now.
    setIsBusy(true);
    try {
      await finish(attempt.id, turns);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSubmitAnswer() {
    if (phase.kind !== 'active') return;
    const text = answerText.trim();
    setError(null);
    setIsBusy(true);
    setPendingAnswer(text);
    setAnswerText('');
    scrollToEnd();
    let saved: Awaited<ReturnType<typeof submitInterviewAnswer>>;
    try {
      saved = await submitInterviewAnswer(id, phase.attemptId, phase.question.id, text);
    } catch (err) {
      setError(apiErrorMessage(err));
      setAnswerText(text); // not saved - keep what they said so they can resend
      setPendingAnswer(null);
      setIsBusy(false);
      return;
    }

    const { answer, nextQuestion } = saved;
    const turns: Turn[] = [
      ...phase.turns,
      {
        id: answer.id,
        question: phase.question,
        answerText: text,
        feedback: parseAssessmentFeedback(answer.feedback, answer.score),
      },
    ];
    setPendingAnswer(null);
    // The answer is saved server-side now; keep the history/resume data in step with it.
    void queryClient.invalidateQueries({ queryKey: attemptsKey });

    if (nextQuestion) {
      setPhase({ ...phase, question: nextQuestion, turns });
      scrollToEnd();
      setIsBusy(false);
      return;
    }

    // Last answer saved. If closing the attempt fails, don't resend the answer - offer a retry.
    setPhase({ kind: 'finish', attemptId: phase.attemptId, turns });
    try {
      await finish(phase.attemptId, turns);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRetryFinish() {
    if (phase.kind !== 'finish') return;
    setError(null);
    setIsBusy(true);
    try {
      await finish(phase.attemptId, phase.turns);
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

  if (phase.kind === 'active') {
    return (
      <ScreenContainer scrollRef={scrollRef}>
        <ThemedText type="title" style={styles.title}>
          {interview.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {phase.resumed ? 'Resumed · ' : ''}Question {phase.question.order}
          {interview.totalQuestions ? ` of ${interview.totalQuestions}` : ''}
        </ThemedText>

        <InterviewTurns turns={phase.turns} />
        <QuestionBubble question={phase.question} />
        {pendingAnswer !== null ? (
          <>
            <UserBubble text={pendingAnswer} />
            <TypingBubble label="Interviewer is reviewing your answer..." icon={AI_ICON} />
          </>
        ) : null}

        <Card>
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
            editable={!isBusy}
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
          <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
            Your answers are saved - you can leave and resume this interview later.
          </ThemedText>
        </Card>
      </ScreenContainer>
    );
  }

  if (phase.kind === 'finish') {
    return (
      <ScreenContainer scrollRef={scrollRef}>
        <ThemedText type="title" style={styles.title}>
          {interview.title}
        </ThemedText>
        <InterviewTurns turns={phase.turns} />
        {isBusy ? <TypingBubble label="Calculating your interview score..." icon={AI_ICON} /> : null}
        {error ? (
          <ThemedText themeColor="danger" type="small">
            {error}
          </ThemedText>
        ) : null}
        <Button label="Finish & get score" onPress={handleRetryFinish} loading={isBusy} />
      </ScreenContainer>
    );
  }

  if (phase.kind === 'completed') {
    return (
      <ScreenContainer>
        <Card style={styles.completedCard}>
          <ScoreBadge score={phase.summary.overallScore ?? 0} size="large" />
          <ThemedText type="smallBold">Interview complete!</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
            Your overall score is the average of every answer. Review each one below.
          </ThemedText>
        </Card>
        <InterviewTurns turns={phase.turns} />
        <Button label="Back to interview & history" onPress={backToIntro} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ThemedText type="title" style={styles.title}>
        {interview.title}
      </ThemedText>
      <ThemedText themeColor="textSecondary">{interview.description}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {interview.totalQuestions ?? '?'} questions • ~{interview.durationMinutes} min
      </ThemedText>
      {error ? (
        <ThemedText themeColor="danger" type="small">
          {error}
        </ThemedText>
      ) : null}
      {unfinished ? (
        <Button
          label={`Resume unfinished interview (${unfinished.answers.length} answered)`}
          onPress={() => handleResume(unfinished)}
          loading={isBusy}
          // Resume from fresh data only - a stale list could point at an already-answered question.
          disabled={attemptsQuery.isFetching}
        />
      ) : null}
      <Button
        label={attempts.length > 0 ? 'Start a new attempt' : 'Start interview'}
        variant={unfinished ? 'secondary' : 'primary'}
        onPress={handleStart}
        loading={isBusy && !unfinished}
        disabled={isBusy}
      />

      {attemptsQuery.isError ? (
        <Pressable onPress={() => attemptsQuery.refetch()}>
          <ThemedText type="small" themeColor="danger">
            Couldn&apos;t load your previous attempts. Tap to retry.
          </ThemedText>
        </Pressable>
      ) : null}

      <HistoryHeader
        title="Your attempts"
        count={attempts.length}
        allExpanded={fold.allExpanded}
        onToggleAll={fold.toggleAll}
      />
      {attempts.map((attempt, index) => {
        const inProgress = attempt.status === 'STARTED';
        return (
          <HistoryGroup
            key={attempt.id}
            icon="account-tie-outline"
            title={`Attempt ${attempts.length - index}`}
            when={`${formatWhen(attempt.createdAt)} · ${attempt.answers.length} answered`}
            preview={attempt.answers[0]?.answerText ?? undefined}
            score={attempt.overallScore}
            statusLabel={inProgress ? 'In progress' : undefined}
            expanded={fold.isExpanded(attempt.id)}
            onToggle={() => fold.toggle(attempt.id)}
          >
            {attempt.answers.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                No questions answered yet.
              </ThemedText>
            ) : (
              <InterviewTurns turns={turnsFrom(attempt)} />
            )}
            {inProgress ? (
              <Button
                label={attempt.nextQuestion ? 'Resume this interview' : 'Finish & get score'}
                onPress={() => handleResume(attempt)}
                disabled={isBusy}
              />
            ) : null}
          </HistoryGroup>
        );
      })}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, lineHeight: 32 },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  completedCard: { gap: 12, alignItems: 'center' },
  centerText: { textAlign: 'center' },
  turn: { gap: Spacing.three },
});
