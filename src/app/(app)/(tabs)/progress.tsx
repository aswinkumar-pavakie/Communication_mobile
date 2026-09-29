import { useQuery } from '@tanstack/react-query';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { fetchProgressHistory, fetchProgressOverview } from '@/api/progress';
import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/empty-state';
import { apiErrorMessage, ErrorState } from '@/components/ui/error-state';
import { HeroCard, HeroPill, HeroScore } from '@/components/ui/hero-card';
import { Chip, ListRow, SectionHeader } from '@/components/ui/list-row';
import { LoadingState } from '@/components/ui/loading-state';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ScoreBadge } from '@/components/ui/score-badge';
import { ScreenContainer } from '@/components/ui/screen-container';
import { useTheme } from '@/hooks/use-theme';
import { relativeDay, scoreTone } from '@/lib/format';
import type { SkillProgress } from '@/types/api';

const CHART_HEIGHT = 110;

/**
 * The API only returns days that had activity; the chart needs all 7. Keys are UTC dates
 * (the backend groups with toISOString), so build the same keys for the last 7 days.
 */
function lastSevenDays(days: { date: string; count: number }[]) {
  const counts = new Map(days.map((d) => [d.date, d.count]));
  return Array.from({ length: 7 }, (_, i) => {
    const key = new Date(Date.now() - (6 - i) * 86_400_000).toISOString().slice(0, 10);
    return { date: key, count: counts.get(key) ?? 0 };
  });
}

function TrendChip({ skill }: { skill: SkillProgress }) {
  const theme = useTheme();
  const delta = skill.previousScore != null ? Math.round(skill.currentScore - skill.previousScore) : null;
  if (skill.trend === 'IMPROVING') {
    return <Chip label={delta ? `+${delta}` : 'Up'} color={theme.success} icon="trending-up" />;
  }
  if (skill.trend === 'DECLINING') {
    return <Chip label={delta ? `${delta}` : 'Down'} color={theme.danger} icon="trending-down" />;
  }
  return <Chip label="Steady" color={theme.textSecondary} icon="minus" />;
}

function WeekChart({ days }: { days: { date: string; count: number }[] }) {
  const theme = useTheme();
  const max = Math.max(1, ...days.map((d) => d.count));
  const today = new Date().toISOString().slice(0, 10);
  return (
    <View style={styles.chart}>
      {days.map((day) => {
        const isToday = day.date === today;
        const height = day.count === 0 ? 6 : 12 + (day.count / max) * (CHART_HEIGHT - 12);
        return (
          <View key={day.date} style={styles.chartCol}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.chartCount}>
              {day.count > 0 ? day.count : ''}
            </ThemedText>
            <View style={[styles.chartTrack, { height: CHART_HEIGHT }]}>
              <View
                style={[
                  styles.chartBar,
                  {
                    height,
                    backgroundColor: day.count === 0 ? theme.backgroundSelected : theme.primary,
                    opacity: isToday || day.count === 0 ? 1 : 0.75,
                  },
                ]}
              />
            </View>
            <ThemedText
              type="small"
              themeColor={isToday ? 'primary' : 'textSecondary'}
              style={[styles.chartDay, isToday && styles.bold]}
            >
              {new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' })}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

export default function ProgressScreen() {
  const theme = useTheme();
  const overviewQuery = useQuery({ queryKey: ['progress-overview'], queryFn: fetchProgressOverview });
  const historyQuery = useQuery({ queryKey: ['progress-history'], queryFn: fetchProgressHistory });

  if (overviewQuery.isLoading || historyQuery.isLoading) {
    return (
      <ScreenContainer edges={[]}>
        <LoadingState label="Loading your progress..." />
      </ScreenContainer>
    );
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <ScreenContainer edges={[]}>
        <ErrorState message={apiErrorMessage(overviewQuery.error)} onRetry={overviewQuery.refetch} />
      </ScreenContainer>
    );
  }

  const { overallScore, skills } = overviewQuery.data;
  const weeklyActivity = lastSevenDays(historyQuery.data?.weeklyActivity ?? []);
  const recentAssessments = historyQuery.data?.recentAssessments ?? [];
  const improving = skills.filter((s) => s.trend === 'IMPROVING').length;
  const weekTotal = weeklyActivity.reduce((sum, d) => sum + d.count, 0);
  const activeDays = weeklyActivity.filter((d) => d.count > 0).length;
  const sortedSkills = [...skills].sort((a, b) => b.currentScore - a.currentScore);
  const refreshing = overviewQuery.isRefetching || historyQuery.isRefetching;

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            void overviewQuery.refetch();
            void historyQuery.refetch();
          }}
          tintColor={theme.primary}
        />
      }
    >
      <HeroCard>
        <View style={styles.heroRow}>
          <HeroScore score={overallScore} />
          <View style={styles.heroText}>
            <ThemedText style={[styles.heroTitle, { color: theme.onPrimary }]}>Overall score</ThemedText>
            <ThemedText style={[styles.heroCaption, { color: theme.onPrimary }]}>
              Average across {skills.length} skill{skills.length === 1 ? '' : 's'}
            </ThemedText>
            {improving > 0 ? <HeroPill label={`${improving} improving`} /> : null}
          </View>
        </View>
      </HeroCard>

      <SectionHeader title="This week" />
      <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.weekSummary}>
          <View>
            <ThemedText style={styles.bigNumber}>{weekTotal}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              practices completed
            </ThemedText>
          </View>
          <Chip label={`${activeDays}/7 active days`} color={theme.primary} icon="calendar-check-outline" />
        </View>
        <WeekChart days={weeklyActivity} />
      </View>

      <SectionHeader title="Skills" />
      {sortedSkills.length > 0 ? (
        <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          {sortedSkills.map((skill, i) => (
            <View
              key={skill.skillCode}
              style={[styles.skill, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border }]}
            >
              <View style={styles.skillTop}>
                <ThemedText type="smallBold" style={styles.flex} numberOfLines={1}>
                  {skill.skillName}
                </ThemedText>
                <TrendChip skill={skill} />
                <ThemedText style={[styles.skillScore, { color: theme[scoreTone(skill.currentScore)] }]}>
                  {Math.round(skill.currentScore)}
                </ThemedText>
              </View>
              <ProgressBar value={skill.currentScore} color={theme[scoreTone(skill.currentScore)]} />
            </View>
          ))}
        </View>
      ) : (
        <EmptyState
          icon="chart-line"
          title="No skills tracked yet"
          message="Complete a few activities and your skill scores will appear here."
        />
      )}

      {recentAssessments.length > 0 ? (
        <>
          <SectionHeader title="Recent feedback" />
          <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            {recentAssessments.map((assessment) => (
              <ListRow
                key={assessment.id}
                variant="plain"
                icon="message-text-outline"
                iconColor={theme.primary}
                title={assessment.feedback}
                subtitle={relativeDay(assessment.createdAt)}
                right={<ScoreBadge score={assessment.overallScore} />}
              />
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '800' },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 14 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroText: { flex: 1, gap: 6 },
  heroTitle: { fontSize: 18, lineHeight: 24, fontWeight: '800' },
  heroCaption: { fontSize: 13, lineHeight: 18, fontWeight: '600', opacity: 0.9 },
  panel: { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  weekSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  bigNumber: { fontSize: 28, lineHeight: 34, fontWeight: '800' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 12, marginBottom: 4 },
  chartCol: { flex: 1, alignItems: 'center', gap: 4 },
  chartCount: { fontSize: 11, lineHeight: 14, minHeight: 14 },
  chartTrack: { width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  chartBar: { width: '70%', maxWidth: 26, borderRadius: 8 },
  chartDay: { fontSize: 12, lineHeight: 16 },
  skill: { gap: 8, paddingVertical: 12 },
  skillTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  skillScore: { fontSize: 16, fontWeight: '800', minWidth: 28, textAlign: 'right' },
});
