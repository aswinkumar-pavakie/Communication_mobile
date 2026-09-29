import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { fetchActivities } from '@/api/activities';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { apiErrorMessage, ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { ScreenContainer } from '@/components/ui/screen-container';
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

function ActivityRow({ activity }: { activity: Activity }) {
  return (
    <Card onPress={() => router.push(`/(app)/activities/${activity.id}`)} style={styles.card}>
      <View style={styles.headerRow}>
        <ThemedText type="smallBold" style={styles.flex}>
          {activity.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {activity.durationMinutes} min
        </ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
        {activity.description}
      </ThemedText>
      <View style={styles.tagsRow}>
        <Tag label={TYPE_LABEL[activity.type] ?? activity.type} />
        <Tag label={activity.difficulty} />
        <Tag label={activity.skill.name} />
      </View>
    </Card>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <ThemedText type="small" themeColor="primary">
        {label}
      </ThemedText>
    </View>
  );
}

export default function ActivitiesScreen() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['activities'],
    queryFn: () => fetchActivities({ limit: 50 }),
  });

  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingState label="Loading activities..." />
      </ScreenContainer>
    );
  }

  if (isError || !data) {
    return (
      <ScreenContainer>
        <ErrorState message={apiErrorMessage(error)} onRetry={refetch} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false}>
      <FlatList
        data={data.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ActivityRow activity={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <ThemedText type="title" style={styles.headerTitle}>
            Activities
          </ThemedText>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: { gap: Spacing.three, paddingBottom: Spacing.four },
  headerTitle: { fontSize: 28, lineHeight: 34, marginBottom: Spacing.one },
  card: { gap: Spacing.two },
  flex: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tagsRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one, flexWrap: 'wrap' },
  tag: { backgroundColor: 'rgba(60,135,247,0.12)', borderRadius: Spacing.two, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
});
