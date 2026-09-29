import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { fetchWritingActivities } from '@/api/writing';
import { ThemedText } from '@/components/themed-text';
import { apiErrorMessage, ErrorState } from '@/components/ui/error-state';
import { IconTileCard } from '@/components/ui/icon-tile-card';
import { LoadingState } from '@/components/ui/loading-state';
import { ScreenContainer } from '@/components/ui/screen-container';
import { TileGrid } from '@/components/ui/tile-grid';
import { humanize } from '@/lib/format';
import { WRITING_TYPE_ICON } from '@/lib/practice-icons';

export default function WritingListScreen() {
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['writing-activities'], queryFn: fetchWritingActivities });

  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingState label="Loading writing activities..." />
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
        emptyMessage="No writing activities available right now."
        header={
          <ThemedText type="small" themeColor="textSecondary" style={styles.intro}>
            Write professional messages and improve them draft by draft.
          </ThemedText>
        }
        renderTile={(item) => (
          <IconTileCard
            onPress={() => router.push(`/(app)/writing/${item.id}`)}
            icon={WRITING_TYPE_ICON[item.type] ?? { name: 'pencil-outline', color: '#8B5CF6' }}
            tags={[humanize(item.difficulty)]}
            title={item.title}
            subtitle={humanize(item.type)}
          />
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: 4 },
});
