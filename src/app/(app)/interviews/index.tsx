import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { fetchInterviews } from '@/api/interviews';
import { ThemedText } from '@/components/themed-text';
import { apiErrorMessage, ErrorState } from '@/components/ui/error-state';
import { IconTileCard } from '@/components/ui/icon-tile-card';
import { LoadingState } from '@/components/ui/loading-state';
import { ScreenContainer } from '@/components/ui/screen-container';
import { TileGrid } from '@/components/ui/tile-grid';
import { humanize } from '@/lib/format';
import { INTERVIEW_TYPE_ICON } from '@/lib/practice-icons';

export default function InterviewsListScreen() {
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['interviews'], queryFn: fetchInterviews });

  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingState label="Loading interviews..." />
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
      <TileGrid
        items={data.items}
        emptyMessage="No mock interviews available right now."
        header={
          <ThemedText type="small" themeColor="textSecondary" style={styles.intro}>
            Answer one question at a time - every answer is scored and saved, so you can resume anytime.
          </ThemedText>
        }
        renderTile={(item) => (
          <IconTileCard
            onPress={() => router.push(`/(app)/interviews/${item.id}`)}
            icon={INTERVIEW_TYPE_ICON[item.type] ?? INTERVIEW_TYPE_ICON.HR}
            tags={[item.type === 'HR' ? 'HR' : humanize(item.type), humanize(item.difficulty)]}
            title={item.title}
            subtitle={`${item.durationMinutes} min`}
          />
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: 4 },
});
