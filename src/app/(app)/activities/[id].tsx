import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type ScrollView } from 'react-native';

import { fetchActivity, fetchActivityAttempts, submitActivityAttempt } from '@/api/activities';
import {
  AttemptGroup,
  CoachBubble,
  HistoryHeader,
  TypingBubble,
  UserBubble,
  useFoldState,
} from '@/components/activity-chat';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiErrorMessage, ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { ScreenContainer } from '@/components/ui/screen-container';
import { TextField } from '@/components/ui/text-field';
import { VoiceRecorderPanel } from '@/components/voice-recorder-panel';
import { Spacing } from '@/constants/theme';
import type { AttemptHistoryItem, AttemptResult, PaginatedResult, PronunciationResult } from '@/types/api';

const VOICE_ELIGIBLE_TYPES = new Set(['SPEAKING', 'INTERVIEW', 'ROLEPLAY', 'DEBATE', 'PRONUNCIATION']);
/** Scored from the audio itself, so typing isn't an option (the backend rejects it too). */
const VOICE_ONLY_TYPES = new Set(['PRONUNCIATION']);

/** What's in flight right now - shown as a user bubble + "reviewing" bubble until the score lands. */
type Pending = { kind: 'text'; text: string } | { kind: 'voice' };

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);

  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [responseText, setResponseText] = useState('');
  const [pending, setPending] = useState<Pending | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  /** Spoken-feedback files exist only on this device for this session, keyed by attempt id. */
  const [feedbackAudio, setFeedbackAudio] = useState<Record<string, string>>({});
  /** Voice attempts made this session - catches spoken answers saved without a stored recording. */
  const [spokenIds, setSpokenIds] = useState<Record<string, true>>({});
  /** Audio-measured pronunciation breakdowns from this session, keyed by attempt id. */
  const [pronunciation, setPronunciation] = useState<Record<string, PronunciationResult>>({});

  const attemptsKey = ['activity-attempts', id];

  const { data: activity, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['activity', id],
    queryFn: () => fetchActivity(id),
  });

  const attemptsQuery = useQuery({
    queryKey: attemptsKey,
    queryFn: () => fetchActivityAttempts(id),
  });

  // API returns newest first; a chat reads oldest -> newest.
  const thread = useMemo(() => [...(attemptsQuery.data?.items ?? [])].reverse(), [attemptsQuery.data]);
  // Only the newest exchange starts open; older ones fold away like past chats.
  const fold = useFoldState(
    thread.map((t) => t.id),
    thread.at(-1)?.id,
  );

  function scrollToEnd() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  }

  function handleResult(
    result: AttemptResult,
    extra: { feedbackAudioUri?: string; spoken?: boolean; pronunciation?: PronunciationResult | null } = {},
  ) {
    const item: AttemptHistoryItem = { ...result.attempt, assessment: result.assessment };
    queryClient.setQueryData<PaginatedResult<AttemptHistoryItem>>(attemptsKey, (old) =>
      old
        ? {
            ...old,
            items: [item, ...old.items.filter((i) => i.id !== item.id)],
            meta: { ...old.meta, total: old.meta.total + 1 },
          }
        : old,
    );
    void queryClient.invalidateQueries({ queryKey: attemptsKey });
    // A scored attempt moves progress, streak and recommendations - refresh those screens too.
    for (const key of ['dashboard', 'progress-overview', 'progress-history', 'streak-calendar']) {
      void queryClient.invalidateQueries({ queryKey: [key] });
    }

    const feedbackAudioUri = extra.feedbackAudioUri;
    if (feedbackAudioUri) setFeedbackAudio((prev) => ({ ...prev, [item.id]: feedbackAudioUri }));
    const measured = extra.pronunciation;
    if (measured) setPronunciation((prev) => ({ ...prev, [item.id]: measured }));
    if (extra.spoken) setSpokenIds((prev) => ({ ...prev, [item.id]: true }));
    fold.reset(); // fold older attempts so the new exchange is the one in focus
    setPending(null);
    scrollToEnd();
  }

  async function handleTextSubmit() {
    const text = responseText.trim();
    setSubmitError(null);
    setPending({ kind: 'text', text });
    setResponseText('');
    scrollToEnd();
    try {
      handleResult(await submitActivityAttempt(id, text));
    } catch (err) {
      setSubmitError(apiErrorMessage(err));
      setResponseText(text); // give the answer back so nothing typed is lost
      setPending(null);
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
  const voiceOnly = VOICE_ONLY_TYPES.has(activity.type);
  const inputMode = voiceOnly ? 'voice' : mode;

  return (
    <ScreenContainer scrollRef={scrollRef}>
      <ThemedText type="title" style={styles.title}>
        {activity.title}
      </ThemedText>
      <ThemedText themeColor="textSecondary">{activity.description}</ThemedText>

      <CoachBubble>
        <ThemedText type="smallBold">Your task</ThemedText>
        <ThemedText type="small">{activity.instructions || activity.description}</ThemedText>
      </CoachBubble>

      <HistoryHeader
        title="Your answers"
        count={thread.length}
        allExpanded={fold.allExpanded}
        onToggleAll={fold.toggleAll}
      />

      {attemptsQuery.isError ? (
        <Pressable onPress={() => attemptsQuery.refetch()}>
          <ThemedText type="small" themeColor="danger">
            Couldn&apos;t load your previous answers. Tap to retry.
          </ThemedText>
        </Pressable>
      ) : null}

      {thread.map((item, index) => (
        <AttemptGroup
          key={item.id}
          number={index + 1}
          item={item}
          expanded={fold.isExpanded(item.id)}
          onToggle={() => fold.toggle(item.id)}
          spoken={Boolean(item.audioUrl) || Boolean(spokenIds[item.id])}
          feedbackAudioUri={feedbackAudio[item.id]}
          pronunciation={pronunciation[item.id]}
        />
      ))}

      {pending ? (
        <View style={styles.pending}>
          {pending.kind === 'text' ? (
            <UserBubble text={pending.text} />
          ) : (
            <UserBubble text="Transcribing your recording..." spoken pending />
          )}
          <TypingBubble label="Coach is reviewing your answer..." />
        </View>
      ) : null}

      <View style={styles.composer}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          {thread.length > 0 ? 'Answer again to improve your score' : 'Your answer'}
        </ThemedText>

        {voiceOnly ? (
          <ThemedText type="small" themeColor="textSecondary">
            Pronunciation is scored from your voice - read the passage aloud clearly.
          </ThemedText>
        ) : null}

        {supportsVoice && !voiceOnly ? (
          <View style={styles.modeSwitch}>
            <Button
              label="Type answer"
              variant={mode === 'text' ? 'primary' : 'secondary'}
              onPress={() => setMode('text')}
              style={styles.modeButton}
              disabled={pending !== null}
            />
            <Button
              label="Record answer"
              variant={mode === 'voice' ? 'primary' : 'secondary'}
              onPress={() => setMode('voice')}
              style={styles.modeButton}
              disabled={pending !== null}
            />
          </View>
        ) : null}

        <Card>
          {inputMode === 'text' || !supportsVoice ? (
            <>
              <TextField
                label="Your response"
                value={responseText}
                onChangeText={setResponseText}
                multiline
                numberOfLines={6}
                style={styles.textArea}
                placeholder="Write your response here..."
                editable={pending === null}
              />
              {submitError ? (
                <ThemedText themeColor="danger" type="small">
                  {submitError}
                </ThemedText>
              ) : null}
              <Button
                label="Send"
                onPress={handleTextSubmit}
                loading={pending?.kind === 'text'}
                disabled={responseText.trim().length === 0 || pending !== null}
              />
            </>
          ) : (
            <VoiceRecorderPanel
              activityId={activity.id}
              onSubmitting={() => {
                setPending({ kind: 'voice' });
                scrollToEnd();
              }}
              onResult={(result, feedbackAudioUri, measured) =>
                handleResult(result, {
                  feedbackAudioUri: feedbackAudioUri ?? undefined,
                  spoken: true,
                  pronunciation: measured,
                })
              }
              onError={() => setPending(null)}
            />
          )}
        </Card>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, lineHeight: 32 },
  pending: { gap: Spacing.three },
  composer: { gap: Spacing.two },
  modeSwitch: { flexDirection: 'row', gap: Spacing.two },
  modeButton: { flex: 1 },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
});
