import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  completeDebateSession,
  fetchDebate,
  fetchDebateSessions,
  sendDebateArgument,
  startDebateSession,
} from '@/api/debates';
import { FeedbackBubble, formatWhen, parseAssessmentFeedback } from '@/components/activity-chat';
import { ActiveChat, ChatThread, SessionHistoryList } from '@/components/chat-practice';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { apiErrorMessage, ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { ScoreBadge } from '@/components/ui/score-badge';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Spacing } from '@/constants/theme';
import type { AssessmentFeedback, ChatMessage, DebatePosition, DebateSessionHistoryItem } from '@/types/api';

type Phase = 'intro' | 'active' | 'completed';

const AI_ICON = 'account-voice';

function positionLabel(position: DebatePosition): string {
  return position === 'FOR' ? 'You argued for' : 'You argued against';
}

export default function DebateSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<Phase>('intro');
  const [position, setPosition] = useState<DebatePosition>('FOR');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [banner, setBanner] = useState<string | undefined>();
  const [draft, setDraft] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number | null; feedback: AssessmentFeedback | null } | null>(null);

  const sessionsKey = ['debate-sessions', id];

  const { data: debate, isLoading, isError, error: loadError, refetch } = useQuery({
    queryKey: ['debate', id],
    queryFn: () => fetchDebate(id),
  });
  const sessionsQuery = useQuery({ queryKey: sessionsKey, queryFn: () => fetchDebateSessions(id) });
  const sessions = sessionsQuery.data?.items ?? [];
  const unfinished = sessions.find((s) => s.status === 'STARTED');

  function backToIntro() {
    void queryClient.invalidateQueries({ queryKey: sessionsKey });
    setPhase('intro');
    setError(null);
  }

  async function handleStart() {
    setError(null);
    setIsBusy(true);
    try {
      const { session, message } = await startDebateSession(id, position);
      setSessionId(session.id);
      setMessages([message]);
      setBanner(`${positionLabel(position)} the motion`);
      setPhase('active');
      void queryClient.invalidateQueries({ queryKey: sessionsKey });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  function handleContinue(session: DebateSessionHistoryItem) {
    setSessionId(session.id);
    setPosition(session.studentPosition);
    setMessages(session.messages);
    setBanner(`Continuing your debate from ${formatWhen(session.createdAt)} · ${positionLabel(session.studentPosition)}`);
    setError(null);
    setPhase('active');
  }

  async function handleSend() {
    if (!sessionId || !draft.trim()) return;
    const userMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      role: 'USER',
      content: draft.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setDraft('');
    setIsBusy(true);
    setIsReplying(true);
    setError(null);
    try {
      const reply = await sendDebateArgument(id, sessionId, userMessage.content);
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsBusy(false);
      setIsReplying(false);
    }
  }

  async function handleFinish() {
    if (!sessionId) return;
    setIsBusy(true);
    setError(null);
    try {
      const summary = await completeDebateSession(id, sessionId);
      setResult({
        score: summary.overallScore,
        feedback: parseAssessmentFeedback(summary.feedback, summary.overallScore),
      });
      setPhase('completed');
      void queryClient.invalidateQueries({ queryKey: sessionsKey });
      for (const key of ['dashboard', 'progress-overview', 'progress-history']) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  if (isLoading) return <LoadingState label="Loading topic..." />;
  if (isError || !debate) return <ErrorState message={apiErrorMessage(loadError)} onRetry={refetch} />;

  if (phase === 'active') {
    return (
      <ActiveChat
        messages={messages}
        aiIcon={AI_ICON}
        draft={draft}
        onDraftChange={setDraft}
        isBusy={isBusy}
        isReplying={isReplying}
        error={error}
        placeholder="Type your argument, or use the mic above..."
        onSend={handleSend}
        onFinish={handleFinish}
        banner={banner}
      />
    );
  }

  if (phase === 'completed') {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <ScoreBadge score={result?.score ?? 0} size="large" />
          <ThemedText type="smallBold">Debate complete!</ThemedText>
        </View>
        {result?.feedback ? <FeedbackBubble assessment={result.feedback} title="Debate feedback" /> : null}
        <ThemedText type="smallBold" themeColor="textSecondary">
          Your debate
        </ThemedText>
        <ChatThread messages={messages} aiIcon={AI_ICON} />
        {/* Back to the intro so the student can pick a side again; history is refreshed there. */}
        <Button label="New debate / view history" onPress={backToIntro} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ThemedText type="title" style={styles.title}>
        {debate.topic}
      </ThemedText>
      <ThemedText themeColor="textSecondary">{debate.description}</ThemedText>

      {unfinished ? (
        <Button label="Continue unfinished debate" onPress={() => handleContinue(unfinished)} />
      ) : null}

      <ThemedText type="smallBold">Pick your position</ThemedText>
      <View style={styles.positionRow}>
        <Button
          label="For"
          variant={position === 'FOR' ? 'primary' : 'secondary'}
          onPress={() => setPosition('FOR')}
          style={styles.flex}
        />
        <Button
          label="Against"
          variant={position === 'AGAINST' ? 'primary' : 'secondary'}
          onPress={() => setPosition('AGAINST')}
          style={styles.flex}
        />
      </View>

      {error ? (
        <ThemedText themeColor="danger" type="small">
          {error}
        </ThemedText>
      ) : null}
      <Button
        label={sessions.length > 0 ? 'Start a new debate' : 'Start debate'}
        variant={unfinished ? 'secondary' : 'primary'}
        onPress={handleStart}
        loading={isBusy}
      />

      {sessionsQuery.isError ? (
        <Pressable onPress={() => sessionsQuery.refetch()}>
          <ThemedText type="small" themeColor="danger">
            Couldn&apos;t load your previous debates. Tap to retry.
          </ThemedText>
        </Pressable>
      ) : null}
      <SessionHistoryList
        sessions={sessions}
        aiIcon={AI_ICON}
        describe={(s) => (s.studentPosition === 'FOR' ? 'For' : 'Against')}
        onContinue={handleContinue}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { fontSize: 26, lineHeight: 32 },
  center: { alignItems: 'center', gap: Spacing.two },
  positionRow: { flexDirection: 'row', gap: 10 },
});
