import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface StreakBadgeProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakBadge({ currentStreak, longestStreak }: StreakBadgeProps) {
  const theme = useTheme();
  const isActive = currentStreak > 0;
  const flameColor = isActive ? theme.warning : theme.textSecondary;

  return (
    <View style={styles.row}>
      <Ionicons name="flame" size={28} color={flameColor} />
      <View style={styles.flex}>
        <ThemedText type="smallBold">
          {isActive
            ? `${currentStreak} day${currentStreak === 1 ? '' : 's'} streak`
            : 'No streak yet'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {isActive
            ? `Complete one activity a day to keep it going${longestStreak > currentStreak ? ` - best: ${longestStreak}` : ''}`
            : 'Complete an activity today to start one'}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
});
