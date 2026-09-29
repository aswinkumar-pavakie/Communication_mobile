import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type ScrollView } from 'react-native';

import { fetchWritingActivity, fetchWritingSubmissions, submitWriting } from '@/api/writing';
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
import { ScreenContainer } from '@/components/ui/screen-container';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import type { PaginatedResult, WritingSubmission } from '@/types/api';

const TASK_ICON = 'pencil-outline';

export default function WritingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);

  const [content, setContent] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submissionsKey = ['writing-submissions', id];

  const { data: activity, isLoading, isError, error: loadError, refetch } = useQuery({
    queryKey: ['writing-activity', id],
    queryFn: () => fetchWritingActivity(id),
  });
  const submissionsQuery = useQuery({ queryKey: submissionsKey, queryFn: () => fetchWritingSubmissions(id) });

  // API returns newest first; read the drafts oldest -> newest like a chat.
  const drafts = useMemo(() => [...(submissionsQuery.data?.items ?? [])].reverse(), [submissionsQuery.data]);
  const latest = drafts.at(-1);
  const fold = useFoldState(
    drafts.map((d) => d.id),
    latest?.id,
  );

  function scrollToEnd() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  }

  async function handleSubmit() {
    const text = content.trim();
    setError(null);
    setPending(text);
    setContent('');
    scrollToEnd();
    try {
      const submission = await submitWriting(id, text);
      queryClient.setQueryData<PaginatedResult<WritingSubmission>>(submissionsKey, (old) =>
        old ? { ...old, items: [submission, ...old.items.filter((s) => s.id !== submission.id)] } : old,
      );
      void queryClient.invalidateQueries({ queryKey: submissionsKey });
      for (const key of ['dashboard', 'progress-overview', 'progress-history']) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
      fold.reset(); // only the new draft stays open
      scrollToEnd();
    } catch (err) {
      setError(apiErrorMessage(err));
      setContent(text); // never lose what they wrote
    } finally {
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
        <ErrorState message={apiErrorMessage(loadError)} onRetry={refetch} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollRef={scrollRef}>
      <ThemedText type="title" style={styles.title}>
        {activity.title}
      </ThemedText>
      {activity.description ? <ThemedText themeColor="textSecondary">{activity.description}</ThemedText> : null}

      <CoachBubble icon={TASK_ICON}>
        <ThemedText type="smallBold">Your task</ThemedText>
        <ThemedText type="small">{activity.prompt}</ThemedText>
      </CoachBubble>

      {submissionsQuery.isError ? (
        <Pressable onPress={() => submissionsQuery.refetch()}>
          <ThemedText type="small" themeColor="danger">
            Couldn&apos;t load your previous drafts. Tap to retry.
          </ThemedText>
        </Pressable>
      ) : null}

      <HistoryHeader
        title="Your drafts"
        count={drafts.length}
        allExpanded={fold.allExpanded}
        onToggleAll={fold.toggleAll}
      />
      {drafts.map((draft, index) => {
        const feedback = parseAssessmentFeedback(draft.feedback, draft.overallScore);
        return (
          <HistoryGroup
            key={draft.id}
            icon={TASK_ICON}
            title={`Draft ${index + 1}`}
            when={formatWhen(draft.createdAt)}
            preview={draft.content}
            score={draft.overallScore}
            expanded={fold.isExpanded(draft.id)}
            onToggle={() => fold.toggle(draft.id)}
          >
            <UserBubble text={draft.content} label="Your writing" />
            {feedback ? <FeedbackBubble assessment={feedback} /> : null}
          </HistoryGroup>
        );
      })}

      {pending !== null ? (
        <View style={styles.pending}>
          <UserBubble text={pending} label="Your writing" />
          <TypingBubble label="Coach is reviewing your writing..." />
        </View>
      ) : null}

      <View style={styles.composer}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          {drafts.length > 0 ? 'Write an improved version' : 'Your submission'}
        </ThemedText>
        <Card>
          {latest && !content ? (
            <Pressable onPress={() => setContent(latest.content)} hitSlop={6}>
              <ThemedText type="smallBold" themeColor="primary">
                Start from my last draft
              </ThemedText>
            </Pressable>
          ) : null}
          <TextField
            label="Your writing"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={10}
            style={styles.textArea}
            placeholder="Write your response here..."
            editable={pending === null}
          />
          {error ? (
            <ThemedText themeColor="danger" type="small">
              {error}
            </ThemedText>
          ) : null}
          <Button
            label="Submit"
            onPress={handleSubmit}
            loading={pending !== null}
            disabled={!content.trim() || pending !== null}
          />
        </Card>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, lineHeight: 32 },
  textArea: { minHeight: 160, textAlignVertical: 'top' },
  pending: { gap: Spacing.three },
  composer: { gap: Spacing.two },
});
