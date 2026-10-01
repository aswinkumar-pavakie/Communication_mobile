import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { fetchDashboard } from '@/api/dashboard';
import { fetchStreakReminders, updateStreakReminders } from '@/api/streaks';
import { ThemedText } from '@/components/themed-text';
import { apiErrorMessage } from '@/components/ui/error-state';
import { Button } from '@/components/ui/button';
import { HeroCard, HeroPill } from '@/components/ui/hero-card';
import { ListRow, SectionHeader, StatTile } from '@/components/ui/list-row';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { humanize, initials } from '@/lib/format';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const profile = user?.studentProfile;
  // Same query key as Home, so this is usually served from cache instantly.
  const { data: dashboard } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard });

  const queryClient = useQueryClient();
  const remindersQuery = useQuery({ queryKey: ['streak-reminders'], queryFn: fetchStreakReminders });
  const remindersMutation = useMutation({
    mutationFn: updateStreakReminders,
    // Flip the switch immediately; roll back if the server says no.
    onMutate: async (enabled: boolean) => {
      await queryClient.cancelQueries({ queryKey: ['streak-reminders'] });
      const previous = queryClient.getQueryData<{ streakReminderEmails: boolean }>(['streak-reminders']);
      queryClient.setQueryData(['streak-reminders'], { streakReminderEmails: enabled });
      return { previous };
    },
    onError: (_err, _enabled, context) => {
      if (context?.previous) queryClient.setQueryData(['streak-reminders'], context.previous);
    },
    onSuccess: (data) => queryClient.setQueryData(['streak-reminders'], data),
  });
  const remindersOn = remindersQuery.data?.streakReminderEmails ?? true;
  const remindersError = remindersMutation.error ?? remindersQuery.error;

  const fullName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : (user?.email ?? 'Student');
  const details = [
    profile?.department,
    profile?.year ? `Year ${profile.year}` : null,
    profile?.batch ? `Batch ${profile.batch}` : null,
  ].filter((d): d is string => Boolean(d));
  const panel = [styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }];

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content}>
      <HeroCard style={styles.hero}>
        <View style={[styles.avatar, { backgroundColor: theme.onPrimary }]}>
          <ThemedText style={[styles.avatarText, { color: theme.primary }]}>
            {initials(profile?.firstName, profile?.lastName, user?.email)}
          </ThemedText>
        </View>
        <ThemedText style={[styles.name, { color: theme.onPrimary }]} numberOfLines={1}>
          {fullName}
        </ThemedText>
        <ThemedText style={[styles.email, { color: theme.onPrimary }]} numberOfLines={1}>
          {user?.email}
        </ThemedText>
        {details.length > 0 ? (
          <View style={styles.pills}>
            {details.map((d) => (
              <HeroPill key={d} label={d} />
            ))}
          </View>
        ) : null}
      </HeroCard>

      {dashboard ? (
        <View style={styles.statsRow}>
          <StatTile icon="star-four-points-outline" color={theme.primary} value={`${Math.round(dashboard.overallScore)}`} label="overall score" />
          <StatTile
            icon="fire"
            color={dashboard.streak.currentStreak > 0 ? '#F97316' : '#9CA3AF'}
            value={`${dashboard.streak.currentStreak}`}
            label="day streak"
            onPress={() => router.push('/(app)/streak')}
          />
          <StatTile icon="trophy-outline" color="#F59E0B" value={`${dashboard.streak.longestStreak}`} label="best streak" />
        </View>
      ) : null}

      <SectionHeader title="Your learning" />
      <View style={panel}>
        <ListRow
          variant="plain"
          icon="file-chart-outline"
          iconColor="#16A34A"
          title="Reports"
          subtitle="Placement readiness reports"
          onPress={() => router.push('/(app)/reports')}
        />
        <ListRow
          variant="plain"
          icon="chart-line"
          iconColor="#0284C7"
          title="Progress"
          subtitle="Skill scores and weekly activity"
          onPress={() => router.push('/(app)/(tabs)/progress')}
        />
        <ListRow
          variant="plain"
          icon="target"
          iconColor="#DB2777"
          title="Practice modes"
          subtitle="Interviews, roleplay, debate, writing"
          onPress={() => router.push('/(app)/(tabs)/practice')}
        />
      </View>

      <SectionHeader title="Notifications" />
      <View style={panel}>
        <ListRow
          variant="plain"
          icon="bell-ring-outline"
          iconColor="#F97316"
          title="Streak reminder emails"
          subtitle="An evening email if your streak is about to break"
          right={
            <Switch
              value={remindersOn}
              onValueChange={(v) => remindersMutation.mutate(v)}
              disabled={remindersQuery.isLoading || remindersMutation.isPending || remindersQuery.isError}
              trackColor={{ true: theme.primary, false: theme.backgroundSelected }}
              thumbColor="#ffffff"
            />
          }
        />
        {remindersError ? (
          <ThemedText type="small" themeColor="danger" style={styles.inlineError}>
            {apiErrorMessage(remindersError)}
          </ThemedText>
        ) : null}
      </View>

      <SectionHeader title="Account" />
      <View style={panel}>
        <ListRow variant="plain" icon="email-outline" iconColor="#6366F1" title="Email" subtitle={user?.email} />
        <ListRow
          variant="plain"
          icon="lock-reset"
          iconColor="#DB2777"
          title="Change password"
          subtitle="Signs you out on other devices"
          onPress={() => router.push('/(app)/change-password')}
        />
        <ListRow
          variant="plain"
          icon="shield-account-outline"
          iconColor="#0891B2"
          title="Role"
          subtitle={user?.role ? humanize(user.role) : undefined}
        />
      </View>

      <Button label="Log out" onPress={logout} variant="danger" style={styles.logout} />
      <ThemedText type="small" themeColor="textSecondary" style={styles.version}>
        Communication Assistant · v{Constants.expoConfig?.version ?? '1.0.0'}
      </ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 14 },
  hero: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  avatar: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  avatarText: { fontSize: 28, fontWeight: '800' },
  name: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  email: { fontSize: 13, lineHeight: 18, opacity: 0.9 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 6 },
  statsRow: { flexDirection: 'row', gap: 8 },
  panel: { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 4 },
  logout: { marginTop: 8 },
  inlineError: { paddingBottom: 8 },
  version: { textAlign: 'center', fontSize: 12 },
});
