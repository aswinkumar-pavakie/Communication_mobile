import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { fetchDashboard } from '@/api/dashboard';
import { ThemedText } from '@/components/themed-text';
import { apiErrorMessage, ErrorState } from '@/components/ui/error-state';
import { HeroCard, HeroPill, HeroScore } from '@/components/ui/hero-card';
import { IconBadge, ListRow, SectionHeader, StatTile, type IconName } from '@/components/ui/list-row';
import { LoadingState } from '@/components/ui/loading-state';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ScoreBadge } from '@/components/ui/score-badge';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { greeting, humanize, initials, relativeDay, scoreTone, tint } from '@/lib/format';
import { ACTIVITY_TYPE_ICON } from '@/lib/practice-icons';

const READINESS_LABEL: Record<string, string> = {
  READY: 'Placement ready',
  DEVELOPING: 'Developing well',
  NEEDS_PRACTICE: 'Needs more practice',
};

const QUICK_START: { label: string; icon: IconName; color: string; href: Href }[] = [
  { label: 'Interview', icon: 'account-tie-outline', color: '#0284C7', href: '/(app)/interviews' },
  { label: 'Roleplay', icon: 'drama-masks', color: '#DB2777', href: '/(app)/roleplay' },
  { label: 'Debate', icon: 'forum-outline', color: '#DC2626', href: '/(app)/debates' },
  { label: 'Writing', icon: 'pencil-outline', color: '#8B5CF6', href: '/(app)/writing' },
];

export default function HomeScreen() {
  const theme = useTheme();
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  });

  if (isLoading) {
    return (
      <ScreenContainer edges={[]}>
        <LoadingState label="Loading your dashboard..." />
      </ScreenContainer>
    );
  }

  if (isError || !data) {
    return (
      <ScreenContainer edges={[]}>
        <ErrorState message={apiErrorMessage(error)} onRetry={refetch} />
      </ScreenContainer>
    );
  }

  const { student, streak, placementReadiness } = data;
  // Streak alive but nothing done yet today = it breaks at midnight.
  const streakAtRisk = streak.currentStreak > 0 && !streak.practicedToday;
  const quickPractice = data.todayActivities[0];
  const topSkills = [...data.skills].sort((a, b) => b.currentScore - a.currentScore).slice(0, 4);

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.primary} />}
    >
      {/* Greeting */}
      <View style={styles.greetingRow}>
        <View style={styles.flex}>
          <ThemedText type="small" themeColor="textSecondary">
            {greeting()},
          </ThemedText>
          <ThemedText style={styles.name} numberOfLines={1}>
            {student.firstName} 👋
          </ThemedText>
        </View>
        <Pressable
          onPress={() => router.push('/(app)/(tabs)/profile')}
          style={[styles.avatar, { backgroundColor: theme.primary }]}
          hitSlop={6}
        >
          <ThemedText style={[styles.avatarText, { color: theme.onPrimary }]}>
            {initials(student.firstName, student.lastName)}
          </ThemedText>
        </Pressable>
      </View>

      {/* Score hero */}
      <HeroCard>
        <View style={styles.heroRow}>
          <HeroScore score={data.overallScore} />
          <View style={styles.heroText}>
            <ThemedText style={[styles.heroTitle, { color: theme.onPrimary }]}>Communication score</ThemedText>
            <HeroPill label={READINESS_LABEL[placementReadiness.label] ?? placementReadiness.label} />
          </View>
        </View>
        <View style={styles.readiness}>
          <View style={styles.readinessLabels}>
            <ThemedText style={[styles.heroCaption, { color: theme.onPrimary }]}>Placement readiness</ThemedText>
            <ThemedText style={[styles.heroCaption, styles.bold, { color: theme.onPrimary }]}>
              {Math.round(placementReadiness.score)}%
            </ThemedText>
          </View>
          <ProgressBar value={placementReadiness.score} color={theme.onPrimary} trackColor="rgba(255,255,255,0.25)" />
        </View>
      </HeroCard>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatTile
          icon="fire"
          color={streak.currentStreak > 0 ? '#F97316' : '#9CA3AF'}
          value={`${streak.currentStreak}`}
          label="day streak"
          onPress={() => router.push('/(app)/streak')}
        />
        <StatTile
          icon="trophy-outline"
          color="#F59E0B"
          value={`${streak.longestStreak}`}
          label="best streak"
          onPress={() => router.push('/(app)/streak')}
        />
        <StatTile icon="chart-line" color="#16A34A" value={`${data.skills.length}`} label="skills tracked" />
      </View>
      {streakAtRisk ? (
        <View style={[styles.riskBanner, { backgroundColor: tint('#F97316', 0.12), borderColor: tint('#F97316', 0.45) }]}>
          <MaterialCommunityIcons name="fire-alert" size={28} color="#F97316" />
          <View style={styles.flex}>
            <ThemedText type="smallBold">
              Your {streak.currentStreak}-day streak ends tonight
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              One quick practice keeps it going.
            </ThemedText>
          </View>
          <Pressable
            onPress={() =>
              quickPractice
                ? router.push(`/(app)/activities/${quickPractice.id}`)
                : router.push('/(app)/(tabs)/activities')
            }
            style={({ pressed }) => [styles.riskButton, { opacity: pressed ? 0.8 : 1 }]}
          >
            <ThemedText type="smallBold" style={styles.riskButtonText}>
              Practice
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        <ThemedText type="small" themeColor="textSecondary" style={styles.streakHint}>
          {streak.practicedToday
            ? "Today's practice is done - see you tomorrow to keep the streak going!"
            : 'Complete any practice today to start a streak.'}
        </ThemedText>
      )}

      {/* Quick start */}
      <SectionHeader title="Quick start" action="All modes" onAction={() => router.push('/(app)/(tabs)/practice')} />
      <View style={styles.quickRow}>
        {QUICK_START.map((q) => (
          <Pressable
            key={q.label}
            onPress={() => router.push(q.href)}
            style={({ pressed }) => [
              styles.quickItem,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <IconBadge name={q.icon} color={q.color} size={42} />
            <ThemedText type="small" style={styles.quickLabel} numberOfLines={1}>
              {q.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {/* Today's activities */}
      {data.todayActivities.length > 0 ? (
        <>
          <SectionHeader
            title="Today's practice"
            action="See all"
            onAction={() => router.push('/(app)/(tabs)/activities')}
          />
          <View style={styles.list}>
            {data.todayActivities.map((activity) => {
              const icon = ACTIVITY_TYPE_ICON[activity.type] ?? ACTIVITY_TYPE_ICON.SPEAKING;
              return (
                <ListRow
                  key={activity.id}
                  icon={icon.name}
                  iconColor={icon.color}
                  title={activity.title}
                  subtitle={`${humanize(activity.type)} · ${humanize(activity.difficulty)} · ${activity.durationMinutes} min`}
                  onPress={() => router.push(`/(app)/activities/${activity.id}`)}
                />
              );
            })}
          </View>
        </>
      ) : null}

      {/* Recommendations */}
      {data.recommendations.length > 0 ? (
        <>
          <SectionHeader title="Recommended for you" />
          <View style={styles.list}>
            {data.recommendations.map((rec) => (
              <ListRow
                key={rec.id}
                icon="lightbulb-on-outline"
                iconColor="#F59E0B"
                title={rec.activity?.title ?? humanize(rec.skillCode)}
                subtitle={rec.reason}
                onPress={rec.activity ? () => router.push(`/(app)/activities/${rec.activity!.id}`) : undefined}
              />
            ))}
          </View>
        </>
      ) : null}

      {/* Skills */}
      {topSkills.length > 0 ? (
        <>
          <SectionHeader title="Top skills" action="Full progress" onAction={() => router.push('/(app)/(tabs)/progress')} />
          <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            {topSkills.map((skill) => (
              <View key={skill.skillCode} style={styles.skill}>
                <View style={styles.skillLabels}>
                  <ThemedText type="small" style={styles.flex} numberOfLines={1}>
                    {skill.skillName}
                  </ThemedText>
                  <ThemedText type="smallBold" themeColor={scoreTone(skill.currentScore)}>
                    {Math.round(skill.currentScore)}
                  </ThemedText>
                </View>
                <ProgressBar value={skill.currentScore} color={theme[scoreTone(skill.currentScore)]} />
              </View>
            ))}
          </View>
        </>
      ) : null}

      {/* Recent activity */}
      <SectionHeader title="Recent activity" />
      {data.recentActivity.length > 0 ? (
        <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          {data.recentActivity.map((item) => {
            const icon = ACTIVITY_TYPE_ICON[item.activityType] ?? ACTIVITY_TYPE_ICON.SPEAKING;
            return (
              <ListRow
                key={item.attemptId}
                variant="plain"
                icon={icon.name}
                iconColor={icon.color}
                title={item.activityTitle}
                subtitle={relativeDay(item.completedAt) || 'In progress'}
                right={item.overallScore != null ? <ScoreBadge score={item.overallScore} /> : undefined}
              />
            );
          })}
        </View>
      ) : (
        <View style={[styles.panel, styles.emptyPanel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="rocket-launch-outline" size={28} color={theme.primary} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            Your completed practice will show up here. Start with a quick activity above!
          </ThemedText>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  bold: { fontWeight: '800' },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 14 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: 26, lineHeight: 32, fontWeight: '800' },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroText: { flex: 1, gap: 8 },
  heroTitle: { fontSize: 18, lineHeight: 24, fontWeight: '800' },
  heroCaption: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  readiness: { gap: 6 },
  readinessLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  statsRow: { flexDirection: 'row', gap: Spacing.two },
  streakHint: { marginTop: -6, fontSize: 12 },
  riskBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 16, padding: 12 },
  riskButton: { backgroundColor: '#F97316', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  riskButtonText: { color: '#ffffff' },
  quickRow: { flexDirection: 'row', gap: Spacing.two },
  quickItem: { flex: 1, alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 16, paddingVertical: 12 },
  quickLabel: { fontSize: 12, fontWeight: '700' },
  list: { gap: Spacing.two },
  panel: { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 },
  emptyPanel: { alignItems: 'center', gap: 8, paddingVertical: 20 },
  skill: { gap: 6, paddingVertical: 8 },
  skillLabels: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
