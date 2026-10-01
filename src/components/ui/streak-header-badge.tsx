import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { fetchDashboard } from '@/api/dashboard';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

const FLAME_ACTIVE = '#FFB020';

/**
 * Flame + day count for the blue navbar. Shares the ['dashboard'] query with Home, so it
 * costs no extra request and updates as soon as a completed practice refreshes the dashboard.
 *
 * `edgeInset`: native stack headers already pad their right items on iOS/Android, but the web
 * stack header doesn't - add the margin there only (tab headers pass their own container padding).
 */
export function StreakHeaderBadge({ edgeInset = false }: { edgeInset?: boolean }) {
  const theme = useTheme();
  const { data } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard });
  if (!data) return null;

  const count = data.streak.currentStreak;
  const active = count > 0;
  // Red dot: the streak is alive but nothing is done yet today, so it breaks at midnight.
  const atRisk = active && !data.streak.practicedToday;

  return (
    <Pressable
      // navigate (not push) so tapping it on the calendar screen itself doesn't stack a copy.
      onPress={() => router.navigate('/(app)/streak')}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={
        active ? `${count} day streak${atRisk ? ', practice today to keep it' : ''}` : 'No streak yet'
      }
      style={({ pressed }) => [
        styles.pill,
        edgeInset && Platform.OS === 'web' && styles.webInset,
        { opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <Ionicons
        name={active ? 'flame' : 'flame-outline'}
        size={18}
        color={active ? FLAME_ACTIVE : 'rgba(255,255,255,0.75)'}
      />
      <ThemedText style={[styles.count, { color: theme.onPrimary }]}>{count}</ThemedText>
      {atRisk ? <View style={[styles.dot, { borderColor: theme.primary }]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  count: { fontSize: 15, lineHeight: 20, fontWeight: '800' },
  webInset: { marginRight: 16 },
  dot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    borderWidth: 2,
  },
});
