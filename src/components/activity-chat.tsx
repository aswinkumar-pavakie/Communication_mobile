import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ScoreBadge } from '@/components/ui/score-badge';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { AssessmentFeedback, AttemptHistoryItem } from '@/types/api';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Left-aligned message from the AI side (coach, interviewer, roleplay partner, opponent). */
export function CoachBubble({ children, icon = 'school-outline' }: { children: ReactNode; icon?: IconName }) {
  const theme = useTheme();
  return (
    <View style={styles.coachRow}>
      <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
        <MaterialCommunityIcons name={icon} size={16} color={theme.onPrimary} />
      </View>
      <View
        style={[
          styles.bubble,
          styles.coachBubble,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

/** Right-aligned message with what the student actually said or typed. */
export function UserBubble({
  text,
  spoken,
  pending,
  label,
}: {
  text: string;
  spoken?: boolean;
  pending?: boolean;
  label?: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.userRow}>
      <View style={[styles.bubble, styles.userBubble, { backgroundColor: theme.primary }]}>
        <View style={styles.userLabel}>
          <MaterialCommunityIcons
            name={spoken ? 'microphone' : 'message-text-outline'}
            size={13}
            color="rgba(255,255,255,0.8)"
          />
          <ThemedText type="small" style={styles.userLabelText}>
            {label ?? (spoken ? 'You said' : 'Your answer')}
          </ThemedText>
        </View>
        <ThemedText style={[{ color: theme.onPrimary }, pending && styles.italic]}>{text}</ThemedText>
      </View>
    </View>
  );
}

export function TypingBubble({ label, icon }: { label: string; icon?: IconName }) {
  const theme = useTheme();
  return (
    <CoachBubble icon={icon}>
      <View style={styles.typing}>
        <ActivityIndicator size="small" color={theme.primary} />
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
      </View>
    </CoachBubble>
  );
}

function BulletSection({ title, items, color }: { title: string; items: string[]; color: 'success' | 'warning' }) {
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor={color}>
        {title}
      </ThemedText>
      {items.map((item, i) => (
        <ThemedText key={i} type="small">
          • {item}
        </ThemedText>
      ))}
    </View>
  );
}

function PlayFeedbackButton({ uri }: { uri: string }) {
  const theme = useTheme();
  const player = useAudioPlayer(uri);
  return (
    <Pressable
      onPress={() => {
        player.seekTo(0);
        player.play();
      }}
      style={({ pressed }) => [styles.inlineAction, { opacity: pressed ? 0.6 : 1 }]}
    >
      <MaterialCommunityIcons name="volume-high" size={16} color={theme.primary} />
      <ThemedText type="smallBold" themeColor="primary">
        Play spoken feedback
      </ThemedText>
    </Pressable>
  );
}

/** The coach's verdict on an answer: score, feedback, strengths, fixes and a foldable model answer. */
export function FeedbackBubble({
  assessment,
  feedbackAudioUri,
  title,
}: {
  assessment: AssessmentFeedback;
  feedbackAudioUri?: string;
  /** Optional heading, e.g. "Session feedback" under a whole conversation. */
  title?: string;
}) {
  const theme = useTheme();
  const [showSuggestion, setShowSuggestion] = useState(false);

  return (
    <CoachBubble>
      {title ? <ThemedText type="smallBold">{title}</ThemedText> : null}
      <View style={styles.feedbackHeader}>
        <ScoreBadge score={assessment.overallScore} />
        <ThemedText type="smallBold" style={styles.flex}>
          {assessment.feedback}
        </ThemedText>
      </View>
      <BulletSection title="Strengths" items={assessment.strengths} color="success" />
      <BulletSection title="Areas to improve" items={assessment.weaknesses} color="warning" />

      {assessment.suggestedResponse ? (
        <View style={styles.section}>
          <Pressable
            onPress={() => setShowSuggestion((v) => !v)}
            style={({ pressed }) => [styles.inlineAction, { opacity: pressed ? 0.6 : 1 }]}
          >
            <MaterialCommunityIcons name="lightbulb-on-outline" size={16} color={theme.primary} />
            <ThemedText type="smallBold" themeColor="primary">
              {showSuggestion ? 'Hide suggested response' : 'Show suggested response'}
            </ThemedText>
          </Pressable>
          {showSuggestion ? (
            <ThemedText type="small" themeColor="textSecondary">
              {assessment.suggestedResponse}
            </ThemedText>
          ) : null}
        </View>
      ) : null}

      {feedbackAudioUri ? <PlayFeedbackButton uri={feedbackAudioUri} /> : null}
    </CoachBubble>
  );
}

/**
 * Feedback is stored as JSON on sessions/answers/submissions; read it defensively so an
 * older or partial record just hides the feedback bubble instead of crashing the screen.
 */
export function parseAssessmentFeedback(raw: unknown, fallbackScore?: number | null): AssessmentFeedback | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;
  if (typeof value.feedback !== 'string') return null;
  const score = typeof value.overallScore === 'number' ? value.overallScore : fallbackScore;
  const strings = (v: unknown) => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : []);
  return {
    overallScore: score ?? 0,
    feedback: value.feedback,
    strengths: strings(value.strengths),
    weaknesses: strings(value.weaknesses),
    suggestedResponse: typeof value.suggestedResponse === 'string' ? value.suggestedResponse : null,
  };
}

export function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Fold/unfold bookkeeping shared by every history list. */
export function useFoldState(ids: string[], defaultOpenId?: string) {
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const isExpanded = (id: string) => toggled[id] ?? id === defaultOpenId;
  const allExpanded = ids.length > 0 && ids.every(isExpanded);
  return {
    isExpanded,
    allExpanded,
    toggle: (id: string) => setToggled((prev) => ({ ...prev, [id]: !isExpanded(id) })),
    toggleAll: () => setToggled(Object.fromEntries(ids.map((id) => [id, !allExpanded]))),
    reset: () => setToggled({}),
  };
}

/** "Your answers (3)" row with an Expand all / Collapse all switch. */
export function HistoryHeader({
  title,
  count,
  allExpanded,
  onToggleAll,
}: {
  title: string;
  count: number;
  allExpanded: boolean;
  onToggleAll: () => void;
}) {
  const theme = useTheme();
  if (count === 0) return null;
  return (
    <View style={styles.historyHeader}>
      <View style={styles.historyTitle}>
        <MaterialCommunityIcons name="history" size={18} color={theme.textSecondary} />
        <ThemedText type="smallBold" themeColor="textSecondary">
          {title} ({count})
        </ThemedText>
      </View>
      {count > 1 ? (
        <Pressable onPress={onToggleAll} hitSlop={8}>
          <ThemedText type="smallBold" themeColor="primary">
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

interface HistoryGroupProps {
  icon: IconName;
  title: string;
  /** Shown under the title; when folded, `preview` is appended so you can tell entries apart. */
  when: string;
  preview?: string;
  score?: number | null;
  /** Replaces the score badge, e.g. "In progress". */
  statusLabel?: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/** A foldable history entry - like a past chat in ChatGPT's sidebar, but inline. */
export function HistoryGroup({
  icon,
  title,
  when,
  preview,
  score,
  statusLabel,
  expanded,
  onToggle,
  children,
}: HistoryGroupProps) {
  const theme = useTheme();
  return (
    <View style={[styles.group, { borderColor: theme.border }]}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [
          styles.groupHeader,
          { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={18} color={theme.primary} />
        <View style={styles.flex}>
          <ThemedText type="smallBold">{title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={expanded ? 1 : 2}>
            {expanded || !preview ? when : `${when} · ${preview}`}
          </ThemedText>
        </View>
        {statusLabel ? (
          <View style={[styles.statusPill, { borderColor: theme.warning }]}>
            <ThemedText type="small" themeColor="warning" style={styles.statusText}>
              {statusLabel}
            </ThemedText>
          </View>
        ) : score != null ? (
          <ScoreBadge score={score} />
        ) : null}
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={theme.textSecondary}
        />
      </Pressable>
      {expanded ? <View style={styles.groupBody}>{children}</View> : null}
    </View>
  );
}

interface AttemptGroupProps {
  number: number;
  item: AttemptHistoryItem;
  expanded: boolean;
  onToggle: () => void;
  spoken: boolean;
  feedbackAudioUri?: string;
}

/** One saved activity answer + feedback exchange. */
export function AttemptGroup({ number, item, expanded, onToggle, spoken, feedbackAudioUri }: AttemptGroupProps) {
  return (
    <HistoryGroup
      icon={spoken ? 'microphone' : 'message-text-outline'}
      title={`Attempt ${number}`}
      when={formatWhen(item.createdAt)}
      preview={item.responseText ?? undefined}
      score={item.assessment?.overallScore ?? item.overallScore ?? null}
      expanded={expanded}
      onToggle={onToggle}
    >
      <UserBubble text={item.responseText?.trim() || '(No speech was detected)'} spoken={spoken} />
      {item.assessment ? (
        <FeedbackBubble assessment={item.assessment} feedbackAudioUri={feedbackAudioUri} />
      ) : (
        <CoachBubble>
          <ThemedText type="small" themeColor="textSecondary">
            This answer wasn&apos;t scored. Try answering again.
          </ThemedText>
        </CoachBubble>
      )}
    </HistoryGroup>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  coachRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  userRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingLeft: 40 },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, gap: Spacing.two },
  coachBubble: { flex: 1, borderWidth: 1, borderTopLeftRadius: 4 },
  userBubble: { maxWidth: '100%', borderTopRightRadius: 4 },
  userLabel: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  userLabelText: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  italic: { fontStyle: 'italic', opacity: 0.85 },
  typing: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  section: { gap: Spacing.one },
  inlineAction: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, paddingVertical: 2 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyTitle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  group: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: 12 },
  groupBody: { padding: 12, gap: Spacing.three },
  statusPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 11, lineHeight: 16 },
});
