import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { fetchStreakCalendar } from '@/api/streaks';
import { ThemedText } from '@/components/themed-text';
import { apiErrorMessage, ErrorState } from '@/components/ui/error-state';
import { HeroCard } from '@/components/ui/hero-card';
import { StatTile } from '@/components/ui/list-row';
import { LoadingState } from '@/components/ui/loading-state';
import { ScreenContainer } from '@/components/ui/screen-container';
import { useTheme } from '@/hooks/use-theme';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PRACTICED = '#F97316';
const PRACTICED_STRONG = '#EA580C';
const FLAME = '#FFB020';
/** How far back the month arrows go. */
const MAX_MONTHS_BACK = 24;

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKey(d.getFullYear(), d.getMonth() + 1);
}

function monthsBetween(a: string, b: string): number {
  const [ay, am] = a.split('-').map(Number);
  const [by, bm] = b.split('-').map(Number);
  return (by - ay) * 12 + (bm - am);
}

function monthTitle(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

type DayState = 'practiced' | 'missed' | 'today' | 'future';

interface Cell {
  day: number;
  date: string;
  count: number;
  state: DayState;
  isToday: boolean;
  /** Part of the streak that's still running (ends today, or yesterday if today isn't done yet). */
  inCurrentRun: boolean;
}

/** Monday-first grid rows for a month, with null padding before day 1 and after the last day. */
function buildRows(month: string, today: string, counts: Map<string, number>): (Cell | null)[][] {
  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const leading = (new Date(y, m - 1, 1).getDay() + 6) % 7; // Mon = 0

  // Walk back from today (or yesterday) over consecutive practiced days = the live streak.
  const run = new Set<string>();
  const [ty, tm, td] = today.split('-').map(Number);
  const cursor = new Date(ty, tm - 1, td);
  const keyOf = (d: Date) => `${monthKey(d.getFullYear(), d.getMonth() + 1)}-${String(d.getDate()).padStart(2, '0')}`;
  if (!counts.get(keyOf(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (counts.get(keyOf(cursor))) {
    run.add(keyOf(cursor));
    cursor.setDate(cursor.getDate() - 1);
  }

  const cells: (Cell | null)[] = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${month}-${String(day).padStart(2, '0')}`;
    const count = counts.get(date) ?? 0;
    const isToday = date === today;
    const state: DayState =
      count > 0 ? 'practiced' : isToday ? 'today' : date > today ? 'future' : 'missed';
    cells.push({ day, date, count, state, isToday, inCurrentRun: run.has(date) });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (Cell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

function DayBox({ cell }: { cell: Cell | null }) {
  const theme = useTheme();
  if (!cell) return <View style={styles.box} />;

  const practiced = cell.state === 'practiced';
  const backgroundColor = practiced
    ? cell.count >= 3
      ? PRACTICED_STRONG
      : PRACTICED
    : cell.state === 'missed'
      ? theme.backgroundSelected
      : 'transparent';
  const borderColor = cell.isToday ? theme.primary : cell.state === 'future' ? theme.border : 'transparent';
  const textColor = practiced ? '#ffffff' : cell.isToday ? theme.primary : theme.textSecondary;

  return (
    <View
      accessibilityLabel={`${cell.date}: ${practiced ? `${cell.count} practice${cell.count === 1 ? '' : 's'}` : 'no practice'}`}
      style={[
        styles.box,
        { backgroundColor, borderColor, borderWidth: cell.isToday ? 2 : 1 },
        cell.state === 'future' && styles.future,
      ]}
    >
      <ThemedText style={[styles.dayNumber, { color: textColor }, practiced && styles.bold]}>{cell.day}</ThemedText>
      {cell.inCurrentRun ? <Ionicons name="flame" size={11} color="#FFF3C4" style={styles.boxFlame} /> : null}
    </View>
  );
}

function LegendItem({ color, label, ring }: { color: string; label: string; ring?: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color, borderColor: ring ?? color }]} />
      <ThemedText type="small" themeColor="textSecondary" style={styles.legendLabel}>
        {label}
      </ThemedText>
    </View>
  );
}

export default function StreakCalendarScreen() {
  const theme = useTheme();
  const now = new Date();
  const currentMonth = monthKey(now.getFullYear(), now.getMonth() + 1);
  const [month, setMonth] = useState(currentMonth);

  const { data, isLoading, isError, error, refetch, isFetching, isPlaceholderData } = useQuery({
    queryKey: ['streak-calendar', month],
    queryFn: () => fetchStreakCalendar(month),
    // Keep the previous month on screen while the next one loads - no blank flash on arrows.
    placeholderData: keepPreviousData,
  });

  const rows = useMemo(() => {
    if (!data) return [];
    const counts = new Map(data.days.map((d) => [d.date, d.count]));
    // While a new month loads, the placeholder still holds the old month's days - draw the
    // grid for the month being shown by the data, so boxes never mismatch their dates.
    return buildRows(data.month, data.today, counts);
  }, [data]);

  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingState label="Loading your streak..." />
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

  const activeDays = data.days.length;
  const practices = data.days.reduce((sum, d) => sum + d.count, 0);
  const practicedToday = data.days.some((d) => d.date === data.today);
  const canGoBack = monthsBetween(month, currentMonth) < MAX_MONTHS_BACK;
  const canGoForward = month < currentMonth;
  const streak = data.currentStreak;

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content}>
      <HeroCard>
        <View style={styles.heroRow}>
          <View style={styles.heroFlame}>
            <Ionicons name={streak > 0 ? 'flame' : 'flame-outline'} size={44} color={streak > 0 ? FLAME : theme.onPrimary} />
          </View>
          <View style={styles.flex}>
            <ThemedText style={[styles.heroCount, { color: theme.onPrimary }]}>
              {streak} day{streak === 1 ? '' : 's'}
            </ThemedText>
            <ThemedText style={[styles.heroCaption, { color: theme.onPrimary }]}>
              {streak === 0
                ? 'Complete any practice today to start a streak.'
                : practicedToday
                  ? "Today's done - come back tomorrow to keep it going!"
                  : 'Practice today to keep your streak alive.'}
            </ThemedText>
          </View>
        </View>
      </HeroCard>

      <View style={styles.statsRow}>
        <StatTile icon="calendar-check-outline" color={PRACTICED} value={`${activeDays}`} label="active days" />
        <StatTile icon="lightning-bolt" color="#6366F1" value={`${practices}`} label="practices" />
        <StatTile icon="trophy-outline" color="#F59E0B" value={`${data.longestStreak}`} label="best streak" />
      </View>

      <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.monthHeader}>
          <Pressable
            onPress={() => setMonth((m) => shiftMonth(m, -1))}
            disabled={!canGoBack}
            hitSlop={10}
            accessibilityLabel="Previous month"
            style={[styles.arrow, !canGoBack && styles.disabled]}
          >
            <MaterialCommunityIcons name="chevron-left" size={26} color={theme.text} />
          </Pressable>
          <View style={styles.monthTitle}>
            <ThemedText style={styles.monthText}>{monthTitle(month)}</ThemedText>
            {isFetching && isPlaceholderData ? <ActivityIndicator size="small" color={theme.primary} /> : null}
          </View>
          <Pressable
            onPress={() => setMonth((m) => shiftMonth(m, 1))}
            disabled={!canGoForward}
            hitSlop={10}
            accessibilityLabel="Next month"
            style={[styles.arrow, !canGoForward && styles.disabled]}
          >
            <MaterialCommunityIcons name="chevron-right" size={26} color={theme.text} />
          </Pressable>
        </View>

        <View style={styles.row}>
          {WEEKDAYS.map((d) => (
            <ThemedText key={d} type="small" themeColor="textSecondary" style={styles.weekday}>
              {d}
            </ThemedText>
          ))}
        </View>

        <View style={[styles.grid, isPlaceholderData && styles.loadingGrid]}>
          {rows.map((row, i) => (
            <View key={i} style={styles.row}>
              {row.map((cell, j) => (
                <DayBox key={cell?.date ?? `pad-${i}-${j}`} cell={cell} />
              ))}
            </View>
          ))}
        </View>

        <View style={styles.legend}>
          <LegendItem color={PRACTICED} label="Practiced" />
          <LegendItem color={theme.backgroundSelected} label="Missed" />
          <LegendItem color="transparent" ring={theme.primary} label="Today" />
        </View>
        <View style={styles.legendNote}>
          <Ionicons name="flame" size={12} color={PRACTICED} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.legendLabel}>
            marks your current streak · darker = 3+ practices that day
          </ThemedText>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '800' },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 14 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroFlame: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroCount: { fontSize: 30, lineHeight: 36, fontWeight: '800' },
  heroCaption: { fontSize: 13, lineHeight: 18, fontWeight: '600', opacity: 0.92 },
  statsRow: { flexDirection: 'row', gap: 8 },
  panel: { borderWidth: 1.5, borderRadius: 18, padding: 14, gap: 10 },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthText: { fontSize: 17, lineHeight: 24, fontWeight: '800' },
  arrow: { padding: 4 },
  disabled: { opacity: 0.25 },
  grid: { gap: 6 },
  loadingGrid: { opacity: 0.5 },
  row: { flexDirection: 'row', gap: 6 },
  weekday: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700' },
  box: { flex: 1, aspectRatio: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  future: { opacity: 0.45, borderStyle: 'dashed' },
  dayNumber: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  boxFlame: { position: 'absolute', bottom: 3 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 14, height: 14, borderRadius: 4, borderWidth: 2 },
  legendLabel: { fontSize: 12 },
  legendNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
});
