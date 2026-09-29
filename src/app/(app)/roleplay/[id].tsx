import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { completeRoleplaySession, fetchRoleplay, sendRoleplayMessage, startRoleplaySession } from '@/api/roleplay';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { ChatBubble } from '@/components/ui/chat-bubble';
import { apiErrorMessage, ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { ScoreBadge } from '@/components/ui/score-badge';
import { TextField } from '@/components/ui/text-field';
import { VoiceToTextButton } from '@/components/voice-to-text-button';
import { useTheme } from '@/hooks/use-theme';
import type { ChatMessage } from '@/types/api';

type Phase = 'intro' | 'active' | 'completed';

export default function RoleplaySessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  const [phase, setPhase] = useState<Phase>('intro');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const { data: roleplay, isLoading, isError, error: loadError, refetch } = useQuery({
    queryKey: ['roleplay', id],
    queryFn: () => fetchRoleplay(id),
  });

  async function handleStart() {
    setError(null);
    setIsBusy(true);
    try {
      const { session, message } = await startRoleplaySession(id);
      setSessionId(session.id);
      setMessages([message]);
      setPhase('active');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
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
    setError(null);
    try {
      const reply = await sendRoleplayMessage(id, sessionId, userMessage.content);
      setMessages((prev) => [...prev, reply]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleFinish() {
    if (!sessionId) return;
    setIsBusy(true);
    setError(null);
    try {
      const summary = await completeRoleplaySession(id, sessionId);
      setFinalScore(summary.overallScore);
      setPhase('completed');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  if (isLoading) return <LoadingState label="Loading scenario..." />;
  if (isError || !roleplay) return <ErrorState message={apiErrorMessage(loadError)} onRetry={refetch} />;

  if (phase === 'intro') {
    return (
      <View style={styles.introContainer}>
        <ThemedText type="title" style={styles.title}>
          {roleplay.title}
        </ThemedText>
        <ThemedText themeColor="textSecondary">{roleplay.description}</ThemedText>
        {error ? (
          <ThemedText themeColor="danger" type="small">
            {error}
          </ThemedText>
        ) : null}
        <Button label="Start scenario" onPress={handleStart} loading={isBusy} />
      </View>
    );
  }

  if (phase === 'completed') {
    return (
      <View style={styles.introContainer}>
        <ScoreBadge score={finalScore ?? 0} size="large" />
        <ThemedText type="smallBold">Session complete!</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centerText}>
          Check your Progress tab to see your updated skill scores.
        </ThemedText>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView ref={scrollRef} style={styles.flex} contentContainerStyle={styles.messages}>
        {messages.map((message) => (
          <ChatBubble key={message.id} role={message.role} content={message.content} />
        ))}
      </ScrollView>

      {error ? (
        <ThemedText themeColor="danger" type="small" style={styles.errorText}>
          {error}
        </ThemedText>
      ) : null}

      <View style={[styles.composer, { borderTopColor: theme.border }]}>
        <VoiceToTextButton
          onTranscript={(text) => setDraft((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text))}
          disabled={isBusy}
        />
        <TextField
          label=""
          value={draft}
          onChangeText={setDraft}
          placeholder="Type your response, or use the mic above..."
          style={styles.composerInput}
        />
        <View style={styles.composerButtons}>
          <Button label="Send" onPress={handleSend} loading={isBusy} disabled={!draft.trim()} style={styles.flex} />
          <Button label="Finish" onPress={handleFinish} variant="secondary" disabled={isBusy} style={styles.flex} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  introContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  title: { fontSize: 26, lineHeight: 32, textAlign: 'center' },
  centerText: { textAlign: 'center' },
  messages: { padding: 16, gap: 4 },
  errorText: { paddingHorizontal: 16 },
  composer: { borderTopWidth: StyleSheet.hairlineWidth, padding: 12, gap: 8 },
  composerInput: { marginBottom: 0 },
  composerButtons: { flexDirection: 'row', gap: 10 },
});
