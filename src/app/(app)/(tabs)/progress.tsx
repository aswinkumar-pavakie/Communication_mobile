import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { fetchProgressHistory, fetchProgressOverview } from '@/api/progress';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { apiErrorMessage, ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { ScoreBadge } from '@/components/ui/score-badge';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TREND_ICON: Record<string, string> = {
  IMPROVING: '▲',
  DECLINING: '▼',
  STABLE: '—',
};

export default function ProgressScreen() {
  const theme = useTheme();
  const overviewQuery = useQuery({ queryKey: ['progress-overview'], queryFn: fetchProgressOverview });
  const historyQuery = useQuery({ queryKey: ['progress-history'], queryFn: fetchProgressHistory });

  if (overviewQuery.isLoading || historyQuery.isLoading) {
    return (
      <ScreenContainer>
        <LoadingState label="Loading your progress..." />
      </ScreenContainer>
    );
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <ScreenContainer>
        <ErrorState message={apiErrorMessage(overviewQuery.error)} onRetry={overviewQuery.refetch} />
      </ScreenContainer>
    );
  }

  const { overallScore, skills } = overviewQuery.data;
  const weeklyActivity = historyQuery.data?.weeklyActivity ?? [];
  const recentAssessments = historyQuery.data?.recentAssessments ?? [];

  return (
    <ScreenContainer>
      <ThemedText type="title" style={styles.title}>
        Progress
      </ThemedText>

      <Card style={styles.overallCard}>
        <ScoreBadge score={overallScore} size="large" />
        <ThemedText type="smallBold">Overall score</ThemedText>
      </Card>

      <Card>
        <ThemedText type="smallBold">Skill breakdown</ThemedText>
        {skills.map((skill) => (
          <View key={skill.skillCode} style={styles.skillRow}>
            <ThemedText type="small" style={styles.flex}>
              {skill.skillName}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {TREND_ICON[skill.trend] ?? ''}
            </ThemedText>
            <ThemedText type="smallBold" themeColor={skill.currentScore >= 60 ? 'success' : 'warning'}>
              {Math.round(skill.currentScore)}
            </ThemedText>
          </View>
        ))}
        {skills.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Complete a few activities to start tracking your skills.
          </ThemedText>
        ) : null}
      </Card>

      {weeklyActivity.length > 0 ? (
        <Card>
          <ThemedText type="smallBold">This week&apos;s activity</ThemedText>
          <View style={styles.weekRow}>
            {weeklyActivity.map((day) => (
              <View key={day.date} style={styles.weekBar}>
                <View style={[styles.bar, { height: 8 + Math.min(day.count, 6) * 10, backgroundColor: theme.primary }]} />
                <ThemedText type="small" themeColor="textSecondary">
                  {day.date.slice(5)}
                </ThemedText>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {recentAssessments.length > 0 ? (
        <Card>
          <ThemedText type="smallBold">Recent assessments</ThemedText>
          {recentAssessments.map((assessment) => (
            <View key={assessment.id} style={styles.skillRow}>
              <ThemedText type="small" style={styles.flex} numberOfLines={1}>
                {assessment.feedback}
              </ThemedText>
              <ThemedText type="smallBold">{Math.round(assessment.overallScore)}</ThemedText>
            </View>
          ))}
        </Card>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, lineHeight: 34 },
  overallCard: { alignItems: 'center', gap: Spacing.two },
  skillRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  weekBar: { alignItems: 'center', gap: Spacing.one, flex: 1 },
  bar: { width: Spacing.three, borderRadius: Spacing.two },
});
