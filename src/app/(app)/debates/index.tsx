import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';

import { fetchDebates } from '@/api/debates';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { apiErrorMessage, ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Spacing } from '@/constants/theme';

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
      <FlatList
        data={data.items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <ThemedText type="title" style={styles.headerTitle}>
            Debates
          </ThemedText>
        }
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/(app)/debates/${item.id}`)} style={styles.card}>
            <ThemedText type="smallBold">{item.topic}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {item.difficulty}
            </ThemedText>
            {item.description ? (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                {item.description}
              </ThemedText>
            ) : null}
          </Card>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.three, paddingBottom: Spacing.four },
  headerTitle: { fontSize: 28, lineHeight: 34, marginBottom: Spacing.one },
  card: { gap: Spacing.two },
});
