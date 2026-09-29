import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { ThemeColor } from '@/constants/theme';

interface ScoreBadgeProps {
  score: number;
  size?: 'small' | 'large';
}

function colorFor(score: number): ThemeColor {
  if (score >= 75) return 'success';
  if (score >= 50) return 'warning';
  return 'danger';
}

export function ScoreBadge({ score, size = 'small' }: ScoreBadgeProps) {
  const theme = useTheme();
  const color = theme[colorFor(score)];
  const dimension = size === 'large' ? 64 : 40;

  return (
    <View
      style={[
        styles.badge,
        { width: dimension, height: dimension, borderRadius: dimension / 2, borderColor: color },
      ]}
    >
      <ThemedText
        type="smallBold"
        style={{ color, fontSize: size === 'large' ? 22 : 14 }}
      >
        {Math.round(score)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
