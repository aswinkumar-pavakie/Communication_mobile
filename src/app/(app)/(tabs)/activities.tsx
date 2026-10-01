import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';

import { fetchActivities } from '@/api/activities';
import { EmptyState } from '@/components/ui/empty-state';
import { apiErrorMessage, ErrorState } from '@/components/ui/error-state';
import {
  IconTileCard,
  IconTileFiller,
  type TileIcon,
  type TileIconName,
} from '@/components/ui/icon-tile-card';
import { LoadingState } from '@/components/ui/loading-state';
import { LIST_CONTENT_TOP_PADDING, ScreenContainer } from '@/components/ui/screen-container';
import { Spacing } from '@/constants/theme';
import type { Activity } from '@/types/api';

const TYPE_LABEL: Record<string, string> = {
  SPEAKING: 'Speaking',
  INTERVIEW: 'Interview',
  ROLEPLAY: 'Roleplay',
  DEBATE: 'Debate',
  VOCABULARY: 'Vocabulary',
  GRAMMAR: 'Grammar',
  LISTENING: 'Listening',
  PRONUNCIATION: 'Pronunciation',
  WRITING: 'Writing',
  NETWORKING: 'Networking',
};

type IconName = TileIconName;
type ActivityIcon = TileIcon;

// Category colors - all dark/saturated enough to read on the white icon badge.
const C = {
  greeting: '#F59E0B',
  tech: '#6366F1',
  work: '#0284C7',
  people: '#10B981',
  learning: '#8B5CF6',
  food: '#F97316',
  nature: '#16A34A',
  health: '#E11D48',
  fun: '#DB2777',
  travel: '#0891B2',
  money: '#15803D',
  alert: '#DC2626',
  time: '#7C3AED',
  goals: '#EA580C',
} as const;

const TYPE_ICON: Record<string, ActivityIcon> = {
  SPEAKING: { name: 'account-voice', color: C.greeting },
  INTERVIEW: { name: 'briefcase-outline', color: C.work },
  ROLEPLAY: { name: 'drama-masks', color: C.fun },
  DEBATE: { name: 'forum-outline', color: C.people },
  VOCABULARY: { name: 'book-alphabet', color: C.learning },
  GRAMMAR: { name: 'spellcheck', color: C.learning },
  LISTENING: { name: 'ear-hearing', color: C.travel },
  PRONUNCIATION: { name: 'volume-high', color: C.tech },
  WRITING: { name: 'pencil-outline', color: C.learning },
  NETWORKING: { name: 'handshake-outline', color: C.people },
};

/**
 * Most activities share a `type` (34 of 50 are SPEAKING), so picking an icon purely by type
 * made most cards look identical. This matches on the activity's actual title instead, so
 * each scenario gets its own icon and color - falls back to TYPE_ICON only when nothing
 * matches. Ordered most-specific-phrase first so e.g. "customer complaint" wins over
 * "complaint".
 */
const KEYWORD_ICON: [string, IconName, string][] = [
  ['self introduction', 'hand-wave-outline', C.greeting],
  ['introducing yourself', 'hand-wave-outline', C.greeting],
  ['tell me about yourself', 'account-circle-outline', C.greeting],
  ['introduction', 'hand-wave-outline', C.greeting],
  ['final-year project', 'laptop', C.tech],
  ['technical concept', 'cog-outline', C.tech],
  ['technical interview', 'code-braces', C.tech],
  ['project interview', 'presentation', C.work],
  ['status update', 'chart-line', C.work],
  ['team conflict', 'account-group-outline', C.people],
  ['disagree', 'handshake-outline', C.people],
  ['senior for help', 'account-question-outline', C.people],
  ['constructive feedback', 'comment-edit-outline', C.people],
  ['workplace problem', 'puzzle-outline', C.work],
  ['email', 'email-outline', C.work],
  ['elevator pitch', 'microphone-variant', C.greeting],
  ['software development', 'robot-outline', C.tech],
  ['vocabulary', 'book-alphabet', C.learning],
  ['grammar', 'spellcheck', C.learning],
  ['childhood', 'teddy-bear', C.fun],
  ['seasons', 'weather-partly-cloudy', C.travel],
  ['weather', 'weather-partly-cloudy', C.travel],
  ['family', 'home-heart', C.health],
  ['hobbies', 'palette-outline', C.fun],
  ['workplace', 'office-building-outline', C.work],
  ['opinion', 'thought-bubble-outline', C.learning],
  ['argue', 'forum-outline', C.alert],
  ['restaurant', 'silverware-fork-knife', C.food],
  ['cooking', 'chef-hat', C.food],
  ['food', 'chef-hat', C.food],
  ['customer service', 'headset', C.work],
  ['customer complaint', 'headset', C.work],
  ['menu', 'book-open-page-variant-outline', C.food],
  ['coffee', 'coffee-outline', C.food],
  ['cafe', 'coffee-outline', C.food],
  ['movies', 'movie-open-outline', C.fun],
  ['music', 'music', C.fun],
  ['health', 'heart-pulse', C.health],
  ['fitness', 'heart-pulse', C.health],
  ['technology', 'cellphone', C.tech],
  ['environment', 'leaf', C.nature],
  ['nature', 'leaf', C.nature],
  ['shopping', 'shopping-outline', C.fun],
  ['directions', 'map-marker-path', C.travel],
  ['complaint', 'alert-circle-outline', C.alert],
  ['hotel', 'bed-outline', C.travel],
  ['airport', 'airplane', C.travel],
  ['news', 'newspaper-variant-outline', C.work],
  ['books', 'bookshelf', C.learning],
  ['social media', 'share-variant-outline', C.fun],
  ['time management', 'timer-outline', C.time],
  ['study habits', 'school-outline', C.learning],
  ['future goals', 'target', C.goals],
  ['festival', 'party-popper', C.goals],
  ['strengths', 'arm-flex-outline', C.health],
  ['weaknesses', 'mirror', C.time],
  ['want this job', 'briefcase-outline', C.work],
  ['challenge you overcame', 'trophy-outline', C.greeting],
  ['see yourself in', 'telescope', C.time],
  ['salary', 'cash-multiple', C.money],
  ['hr interview', 'account-tie-outline', C.work],
  ['daily routine', 'calendar-clock', C.time],
  ['talk about anything', 'chat-outline', C.people],
];

function iconFor(activity: Activity): ActivityIcon {
  const title = activity.title.toLowerCase();
  const match = KEYWORD_ICON.find(([keyword]) => title.includes(keyword));
  if (match) return { name: match[1], color: match[2] };
  return TYPE_ICON[activity.type] ?? { name: 'star-four-points-outline', color: C.goals };
}

/** "INTERMEDIATE" -> "Intermediate": shorter and keeps both tags on one line in a half-width card. */
function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function ActivityRow({ activity }: { activity: Activity | null }) {
  if (!activity) {
    // Keeps an odd-length list's last card half-width instead of stretching across the row.
    return <IconTileFiller />;
  }

  return (
    <IconTileCard
      onPress={() => router.push(`/(app)/activities/${activity.id}`)}
      icon={iconFor(activity)}
      tags={[TYPE_LABEL[activity.type] ?? activity.type, titleCase(activity.difficulty)]}
      title={activity.title}
      subtitle={`${activity.durationMinutes} min`}
    />
  );
}

export default function ActivitiesScreen() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['activities'],
    queryFn: () => fetchActivities({ limit: 100 }), // server max (MAX_PAGE_LIMIT)
  });

  if (isLoading) {
    return (
      <ScreenContainer edges={[]}>
        <LoadingState label="Loading activities..." />
      </ScreenContainer>
    );
  }

  if (isError || !data) {
    return (
      <ScreenContainer edges={[]}>
        <ErrorState message={apiErrorMessage(error)} onRetry={refetch} />
      </ScreenContainer>
    );
  }

  const gridItems: (Activity | null)[] =
    data.items.length % 2 === 0 ? data.items : [...data.items, null];

  return (
    <ScreenContainer scroll={false} edges={[]}>
      <FlatList
        data={gridItems}
        keyExtractor={(item, index) => item?.id ?? `filler-${index}`}
        renderItem={({ item }) => <ActivityRow activity={item} />}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState message="No activities available right now." />}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    gap: Spacing.two,
    paddingTop: LIST_CONTENT_TOP_PADDING,
    paddingBottom: Spacing.four,
    flexGrow: 1,
  },
  columnWrapper: { gap: Spacing.two },
});
