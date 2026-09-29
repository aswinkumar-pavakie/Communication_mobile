import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { fetchReports } from '@/api/reports';
import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/empty-state';
import { apiErrorMessage, ErrorState } from '@/components/ui/error-state';
import { HeroCard, HeroPill, HeroScore } from '@/components/ui/hero-card';
import { ListRow, SectionHeader } from '@/components/ui/list-row';
import { LoadingState } from '@/components/ui/loading-state';
import { ScoreBadge } from '@/components/ui/score-badge';
import { ScreenContainer } from '@/components/ui/screen-container';
import { useTheme } from '@/hooks/use-theme';
import { readinessText, shortDate } from '@/lib/format';
import type { Report } from '@/types/api';

function period(report: Report): string {
  return `${shortDate(report.periodStart)} – ${shortDate(report.periodEnd)}`;
}

export default function ReportsListScreen() {
  const theme = useTheme();
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['reports'],
    queryFn: fetchReports,
  });

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

  const [latest, ...older] = data.items;

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.primary} />}
    >
      {!latest ? (
        <EmptyState
          icon="file-chart-outline"
          title="No reports yet"
          message="Complete a few practice sessions and your placement readiness report will be generated here."
        />
      ) : (
        <>
          <SectionHeader title="Latest report" />
          <Pressable onPress={() => router.push(`/(app)/reports/${latest.id}`)}>
            {({ pressed }) => (
              <HeroCard style={{ opacity: pressed ? 0.85 : 1 }}>
                <View style={styles.heroRow}>
                  <HeroScore score={latest.overallScore} />
                  <View style={styles.heroText}>
                    <ThemedText style={[styles.heroTitle, { color: theme.onPrimary }]}>{period(latest)}</ThemedText>
                    <HeroPill label={readinessText(latest.interviewReadiness.label)} />
                    <ThemedText style={[styles.heroLink, { color: theme.onPrimary }]}>View full report →</ThemedText>
                  </View>
                </View>
              </HeroCard>
            )}
          </Pressable>

          {older.length > 0 ? (
            <>
              <SectionHeader title="Earlier reports" />
              <View style={styles.list}>
                {older.map((report) => (
                  <ListRow
                    key={report.id}
                    icon="file-chart-outline"
                    iconColor="#16A34A"
                    title={period(report)}
                    subtitle={readinessText(report.interviewReadiness.label)}
                    right={<ScoreBadge score={report.overallScore} />}
                    onPress={() => router.push(`/(app)/reports/${report.id}`)}
                  />
                ))}
              </View>
            </>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, gap: 12, flexGrow: 1 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroText: { flex: 1, gap: 8 },
  heroTitle: { fontSize: 18, lineHeight: 24, fontWeight: '800' },
  heroLink: { fontSize: 13, fontWeight: '700', opacity: 0.9 },
  list: { gap: 8 },
});
