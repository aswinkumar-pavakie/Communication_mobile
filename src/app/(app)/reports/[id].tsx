import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { fetchReport } from '@/api/reports';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { apiErrorMessage, ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { ScoreBadge } from '@/components/ui/score-badge';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Spacing } from '@/constants/theme';

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: report, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['report', id],
    queryFn: () => fetchReport(id),
  });

  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingState label="Loading report..." />
      </ScreenContainer>
    );
  }

  if (isError || !report) {
    return (
      <ScreenContainer>
        <ErrorState message={apiErrorMessage(error)} onRetry={refetch} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Card style={styles.headerCard}>
        <ScoreBadge score={report.overallScore} size="large" />
        <ThemedText type="smallBold">{report.interviewReadiness.label}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {new Date(report.periodStart).toLocaleDateString()} - {new Date(report.periodEnd).toLocaleDateString()}
        </ThemedText>
      </Card>

      {report.strengths.length > 0 ? (
        <Card>
          <ThemedText type="smallBold" themeColor="success">
            Strengths
          </ThemedText>
          {report.strengths.map((s, i) => (
            <ThemedText key={i} type="small">
              • {s}
            </ThemedText>
          ))}
        </Card>
      ) : null}

      {report.weaknesses.length > 0 ? (
        <Card>
          <ThemedText type="smallBold" themeColor="warning">
            Weaknesses
          </ThemedText>
          {report.weaknesses.map((w, i) => (
            <ThemedText key={i} type="small">
              • {w}
            </ThemedText>
          ))}
        </Card>
      ) : null}

      {report.recommendedActions.length > 0 ? (
        <Card>
          <ThemedText type="smallBold">Recommended actions</ThemedText>
          {report.recommendedActions.map((action, i) => (
            <ThemedText key={i} type="small">
              • {action}
            </ThemedText>
          ))}
        </Card>
      ) : null}

      {report.skillBreakdown.length > 0 ? (
        <Card>
          <ThemedText type="smallBold">Skill breakdown</ThemedText>
          {report.skillBreakdown.map((skill) => (
            <View key={skill.skillCode} style={styles.skillRow}>
              <ThemedText type="small" style={styles.flex}>
                {skill.skillName}
              </ThemedText>
              <ThemedText type="smallBold">{Math.round(skill.currentScore)}</ThemedText>
            </View>
          ))}
        </Card>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerCard: { alignItems: 'center', gap: Spacing.two },
  skillRow: { flexDirection: 'row', justifyContent: 'space-between' },
  flex: { flex: 1 },
});
