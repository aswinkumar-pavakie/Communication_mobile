import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { fetchDashboard } from '@/api/dashboard';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { apiErrorMessage, ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { ScoreBadge } from '@/components/ui/score-badge';
import { ScreenContainer } from '@/components/ui/screen-container';
import { StreakBadge } from '@/components/ui/streak-badge';

const READINESS_LABEL: Record<string, string> = {
  READY: 'Placement ready',
  DEVELOPING: 'Developing well',
  NEEDS_PRACTICE: 'Needs more practice',
};

export default function HomeScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  });

  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingState label="Loading your dashboard..." />
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
    <ScreenContainer>
      <View>
        <ThemedText type="small" themeColor="textSecondary">
          Welcome back,
        </ThemedText>
        <ThemedText type="title" style={styles.name}>
          {data.student.firstName}
        </ThemedText>
      </View>

      <Card style={styles.scoreCard}>
        <ScoreBadge score={data.overallScore} size="large" />
        <View style={styles.flex}>
          <ThemedText type="smallBold">Overall communication score</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {READINESS_LABEL[data.placementReadiness.label] ?? data.placementReadiness.label}
          </ThemedText>
        </View>
      </Card>

      <Card>
        <StreakBadge
          currentStreak={data.streak.currentStreak}
          longestStreak={data.streak.longestStreak}
        />
      </Card>

      {data.skills.length > 0 ? (
        <Card>
          <ThemedText type="smallBold">Skill scores</ThemedText>
          {data.skills.map((skill) => (
            <View key={skill.skillCode} style={styles.skillRow}>
              <ThemedText type="small" style={styles.flex}>
                {skill.skillName}
              </ThemedText>
              <ThemedText type="smallBold" themeColor={skill.currentScore >= 60 ? 'success' : 'warning'}>
                {Math.round(skill.currentScore)}
              </ThemedText>
            </View>
          ))}
        </Card>
      ) : null}

      {data.todayActivities.length > 0 ? (
        <Card>
          <ThemedText type="smallBold">Today&apos;s activities</ThemedText>
          {data.todayActivities.map((activity) => (
            <View key={activity.id} style={styles.linkRow}>
              <ThemedText
                type="link"
                themeColor="primary"
                onPress={() => router.push(`/(app)/activities/${activity.id}`)}
              >
                {activity.title}
              </ThemedText>
            </View>
          ))}
        </Card>
      ) : null}

      {data.recommendations.length > 0 ? (
        <Card>
          <ThemedText type="smallBold">Recommended for you</ThemedText>
          {data.recommendations.map((rec) => (
            <ThemedText key={rec.id} type="small" themeColor="textSecondary" style={styles.recText}>
              • {rec.reason}
            </ThemedText>
          ))}
        </Card>
      ) : null}

      {data.recentActivity.length > 0 ? (
        <Card>
          <ThemedText type="smallBold">Recent activity</ThemedText>
          {data.recentActivity.map((item) => (
            <View key={item.attemptId} style={styles.skillRow}>
              <ThemedText type="small" style={styles.flex}>
                {item.activityTitle}
              </ThemedText>
              {item.overallScore != null ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {Math.round(item.overallScore)}
                </ThemedText>
              ) : null}
            </View>
          ))}
        </Card>
      ) : null}

      {isRefetching ? <ThemedText type="small" themeColor="textSecondary">Refreshing...</ThemedText> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 28, lineHeight: 34 },
  flex: { flex: 1 },
  scoreCard: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  skillRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  linkRow: { paddingVertical: 4 },
  recText: { marginTop: 4 },
});
