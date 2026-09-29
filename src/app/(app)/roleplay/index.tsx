import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { fetchRoleplays } from '@/api/roleplay';
import { ThemedText } from '@/components/themed-text';
import { apiErrorMessage, ErrorState } from '@/components/ui/error-state';
import { IconTileCard } from '@/components/ui/icon-tile-card';
import { LoadingState } from '@/components/ui/loading-state';
import { ScreenContainer } from '@/components/ui/screen-container';
import { TileGrid } from '@/components/ui/tile-grid';
import { humanize } from '@/lib/format';
import { ROLEPLAY_SCENARIO_ICON } from '@/lib/practice-icons';

export default function RoleplayListScreen() {
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['roleplays'], queryFn: fetchRoleplays });

  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingState label="Loading scenarios..." />
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
        emptyMessage="No roleplay scenarios available right now."
        header={
          <ThemedText type="small" themeColor="textSecondary" style={styles.intro}>
            Chat through real workplace situations. Unfinished conversations are saved for later.
          </ThemedText>
        }
        renderTile={(item) => (
          <IconTileCard
            onPress={() => router.push(`/(app)/roleplay/${item.id}`)}
            icon={ROLEPLAY_SCENARIO_ICON[item.scenario] ?? { name: 'drama-masks', color: '#DB2777' }}
            tags={[humanize(item.difficulty)]}
            title={item.title}
            subtitle={humanize(item.scenario)}
          />
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: 4 },
});
