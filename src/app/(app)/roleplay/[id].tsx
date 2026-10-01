import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  completeRoleplaySession,
  fetchRoleplay,
  fetchRoleplaySessions,
  sendRoleplayMessage,
  startRoleplaySession,
} from '@/api/roleplay';
import { FeedbackBubble, formatWhen, parseAssessmentFeedback } from '@/components/activity-chat';
import { ActiveChat, ChatThread, SessionHistoryList } from '@/components/chat-practice';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { apiErrorMessage, ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { ScoreBadge } from '@/components/ui/score-badge';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Spacing } from '@/constants/theme';
import type { AssessmentFeedback, ChatMessage, ChatSessionHistoryItem } from '@/types/api';

type Phase = 'intro' | 'active' | 'completed';

const AI_ICON = 'account-tie-outline';

export default function RoleplaySessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<Phase>('intro');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [banner, setBanner] = useState<string | undefined>();
  const [draft, setDraft] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number | null; feedback: AssessmentFeedback | null } | null>(null);

  const sessionsKey = ['roleplay-sessions', id];

  const { data: roleplay, isLoading, isError, error: loadError, refetch } = useQuery({
    queryKey: ['roleplay', id],
    queryFn: () => fetchRoleplay(id),
  });
  const sessionsQuery = useQuery({ queryKey: sessionsKey, queryFn: () => fetchRoleplaySessions(id) });
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
      const { session, message } = await startRoleplaySession(id);
      setSessionId(session.id);
      setMessages([message]);
      setBanner(undefined);
      setPhase('active');
      void queryClient.invalidateQueries({ queryKey: sessionsKey });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  function handleContinue(session: ChatSessionHistoryItem) {
    setSessionId(session.id);
    setMessages(session.messages);
    setBanner(`Continuing your conversation from ${formatWhen(session.createdAt)}`);
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
      const reply = await sendRoleplayMessage(id, sessionId, userMessage.content);
      setMessages((prev) => [...prev, reply]);
      // Keep the saved-conversations list current, so leaving and tapping Continue resumes here.
      void queryClient.invalidateQueries({ queryKey: sessionsKey });
    } catch (err) {
      // Nothing was saved (the backend stores both messages only on success) - take the
      // bubble back out and return the text to the box so it can be resent.
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      setDraft((current) => current || userMessage.content);
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
      const summary = await completeRoleplaySession(id, sessionId);
      setResult({
        score: summary.overallScore,
        feedback: parseAssessmentFeedback(summary.feedback, summary.overallScore),
      });
      setPhase('completed');
      void queryClient.invalidateQueries({ queryKey: sessionsKey });
      for (const key of ['dashboard', 'progress-overview', 'progress-history', 'streak-calendar']) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  if (isLoading) return <LoadingState label="Loading scenario..." />;
  if (isError || !roleplay) return <ErrorState message={apiErrorMessage(loadError)} onRetry={refetch} />;

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
        placeholder="Type your response, or use the mic above..."
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
          <ThemedText type="smallBold">Session complete!</ThemedText>
        </View>
        {result?.feedback ? <FeedbackBubble assessment={result.feedback} title="Conversation feedback" /> : null}
        <ThemedText type="smallBold" themeColor="textSecondary">
          Your conversation
        </ThemedText>
        <ChatThread messages={messages} aiIcon={AI_ICON} />
        <Button label="Start a new conversation" onPress={handleStart} loading={isBusy} />
        <Button label="Back to history" variant="secondary" onPress={backToIntro} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ThemedText type="title" style={styles.title}>
        {roleplay.title}
      </ThemedText>
      <ThemedText themeColor="textSecondary">{roleplay.description}</ThemedText>
      {error ? (
        <ThemedText themeColor="danger" type="small">
          {error}
        </ThemedText>
      ) : null}
      {unfinished ? (
        <Button
          label="Continue unfinished conversation"
          onPress={() => handleContinue(unfinished)}
          disabled={sessionsQuery.isFetching}
        />
      ) : null}
      <Button
        label={sessions.length > 0 ? 'Start a new conversation' : 'Start scenario'}
        variant={unfinished ? 'secondary' : 'primary'}
        onPress={handleStart}
        loading={isBusy}
      />

      {sessionsQuery.isError ? (
        <Pressable onPress={() => sessionsQuery.refetch()}>
          <ThemedText type="small" themeColor="danger">
            Couldn&apos;t load your previous conversations. Tap to retry.
          </ThemedText>
        </Pressable>
      ) : null}
      <SessionHistoryList sessions={sessions} aiIcon={AI_ICON} onContinue={handleContinue} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, lineHeight: 32 },
  center: { alignItems: 'center', gap: Spacing.two },
});
