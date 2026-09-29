import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { fetchDebates } from '@/api/debates';
import { ThemedText } from '@/components/themed-text';
import { apiErrorMessage, ErrorState } from '@/components/ui/error-state';
import { IconTileCard } from '@/components/ui/icon-tile-card';
import { LoadingState } from '@/components/ui/loading-state';
import { ScreenContainer } from '@/components/ui/screen-container';
import { TileGrid } from '@/components/ui/tile-grid';
import { humanize } from '@/lib/format';
import { debateIcon } from '@/lib/practice-icons';

export default function DebatesListScreen() {
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['debates'], queryFn: fetchDebates });

  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingState label="Loading topics..." />
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
        emptyMessage="No debate topics available right now."
        header={
          <ThemedText type="small" themeColor="textSecondary" style={styles.intro}>
            Pick a side and argue against the AI. You get feedback on your reasoning when you finish.
          </ThemedText>
        }
        renderTile={(item) => (
          <IconTileCard
            onPress={() => router.push(`/(app)/debates/${item.id}`)}
            icon={debateIcon(item.topic)}
            tags={['For / Against', humanize(item.difficulty)]}
            title={item.topic}
            subtitle={item.description ?? 'Debate'}
          />
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: 4 },
});
