import { type MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, type ComponentProps } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import { TextField } from '@/components/ui/text-field';
import { VoiceToTextButton } from '@/components/voice-to-text-button';
import { useTheme } from '@/hooks/use-theme';
import type { ChatMessage, ChatSessionHistoryItem } from '@/types/api';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** A conversation rendered as chat bubbles: the student on the right, the AI partner on the left. */
export function ChatThread({ messages, aiIcon }: { messages: ChatMessage[]; aiIcon: IconName }) {
  return (
    <>
      {messages
        .filter((m) => m.role !== 'SYSTEM')
        .map((m) =>
          m.role === 'USER' ? (
            <UserBubble key={m.id} text={m.content} label="You" />
          ) : (
            <CoachBubble key={m.id} icon={aiIcon}>
              <ThemedText type="small">{m.content}</ThemedText>
            </CoachBubble>
          ),
        )}
    </>
  );
}

interface ActiveChatProps {
  messages: ChatMessage[];
  aiIcon: IconName;
  draft: string;
  /** Accepts an updater so a finished voice transcript appends to what's typed *now*. */
  onDraftChange: (next: string | ((prev: string) => string)) => void;
  isBusy: boolean;
  /** True while waiting for the AI's reply (vs. finishing/scoring). */
  isReplying: boolean;
  error: string | null;
  placeholder: string;
  onSend: () => void;
  onFinish: () => void;
  /** Shown above the chat, e.g. "Continuing your conversation from Sep 29". */
  banner?: string;
}

/** Live chat: scrolling messages + mic/text composer + Send/Finish. */
export function ActiveChat({
  messages,
  aiIcon,
  draft,
  onDraftChange,
  isBusy,
  isReplying,
  error,
  placeholder,
  onSend,
  onFinish,
  banner,
}: ActiveChatProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  // Native stack header = status bar inset + standard bar height (44pt iOS, 56dp Android).
  const headerHeight = insets.top + (Platform.OS === 'ios' ? 44 : 56);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [messages.length, isReplying]);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView ref={scrollRef} style={styles.flex} contentContainerStyle={styles.messages}>
        {banner ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.banner}>
            {banner}
          </ThemedText>
        ) : null}
        <ChatThread messages={messages} aiIcon={aiIcon} />
        {isReplying ? <TypingBubble label="Typing..." icon={aiIcon} /> : null}
      </ScrollView>

      {error ? (
        <ThemedText themeColor="danger" type="small" style={styles.errorText}>
          {error}
        </ThemedText>
      ) : null}

      <View
        style={[
          styles.composer,
          // Clear the Android nav bar / iOS home indicator (edge-to-edge).
          { borderTopColor: theme.border, backgroundColor: theme.background, paddingBottom: insets.bottom + 12 },
        ]}
      >
        <VoiceToTextButton
          onTranscript={(text) => onDraftChange((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text))}
          disabled={isBusy}
        />
        <TextField label="" value={draft} onChangeText={onDraftChange} placeholder={placeholder} />
        <View style={styles.composerButtons}>
          <Button
            label="Send"
            onPress={onSend}
            loading={isReplying}
            disabled={!draft.trim() || isBusy}
            style={styles.flex}
          />
          <Button
            label="Finish & get feedback"
            onPress={onFinish}
            variant="secondary"
            loading={isBusy && !isReplying}
            disabled={isBusy || !messages.some((m) => m.role === 'USER')}
            style={styles.flex}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

interface SessionHistoryListProps<T extends ChatSessionHistoryItem> {
  sessions: T[];
  aiIcon: IconName;
  /** Extra header detail per session, e.g. the debate side the student argued. */
  describe?: (session: T) => string | undefined;
  onContinue: (session: T) => void;
}

/** Every saved conversation, foldable; unfinished ones can be continued. */
export function SessionHistoryList<T extends ChatSessionHistoryItem>({
  sessions,
  aiIcon,
  describe,
  onContinue,
}: SessionHistoryListProps<T>) {
  const fold = useFoldState(sessions.map((s) => s.id));

  return (
    <>
      <HistoryHeader
        title="Your conversations"
        count={sessions.length}
        allExpanded={fold.allExpanded}
        onToggleAll={fold.toggleAll}
      />
      {sessions.map((session, index) => {
        const inProgress = session.status === 'STARTED';
        const feedback = parseAssessmentFeedback(session.feedback, session.overallScore);
        const firstReply = session.messages.find((m) => m.role === 'USER')?.content;
        const extra = describe?.(session);
        const userTurns = session.messages.filter((m) => m.role === 'USER').length;
        return (
          <HistoryGroup
            key={session.id}
            icon="forum-outline"
            title={`Conversation ${sessions.length - index}${extra ? ` · ${extra}` : ''}`}
            when={`${formatWhen(session.createdAt)} · ${userTurns} ${userTurns === 1 ? 'reply' : 'replies'}`}
            preview={firstReply}
            score={session.overallScore}
            statusLabel={inProgress ? 'In progress' : undefined}
            expanded={fold.isExpanded(session.id)}
            onToggle={() => fold.toggle(session.id)}
          >
            <ChatThread messages={session.messages} aiIcon={aiIcon} />
            {feedback ? <FeedbackBubble assessment={feedback} title="Conversation feedback" /> : null}
            {inProgress ? <Button label="Continue this conversation" onPress={() => onContinue(session)} /> : null}
          </HistoryGroup>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  messages: { padding: 16, gap: 12 },
  banner: { textAlign: 'center' },
  errorText: { paddingHorizontal: 16 },
  composer: { borderTopWidth: StyleSheet.hairlineWidth, padding: 12, gap: 8 },
  composerButtons: { flexDirection: 'row', gap: 10 },
});
