import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { fetchReports } from '@/api/reports';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { apiErrorMessage, ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { ScoreBadge } from '@/components/ui/score-badge';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Spacing } from '@/constants/theme';

export default function ReportsListScreen() {
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['reports'], queryFn: fetchReports });

  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingState label="Loading reports..." />
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
            Reports
          </ThemedText>
        }
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/(app)/reports/${item.id}`)} style={styles.card}>
            <View style={styles.row}>
              <ScoreBadge score={item.overallScore} />
              <View style={styles.flex}>
                <ThemedText type="smallBold">
                  {new Date(item.periodStart).toLocaleDateString()} - {new Date(item.periodEnd).toLocaleDateString()}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.interviewReadiness.label}
                </ThemedText>
              </View>
            </View>
          </Card>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.three, paddingBottom: Spacing.four },
  headerTitle: { fontSize: 28, lineHeight: 34, marginBottom: Spacing.one },
  card: {},
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
});
