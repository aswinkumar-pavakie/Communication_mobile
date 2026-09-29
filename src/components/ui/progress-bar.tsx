import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface ProgressBarProps {
  /** 0-100. */
  value: number;
  color?: string;
  trackColor?: string;
  height?: number;
}

export function ProgressBar({ value, color, trackColor, height = 8 }: ProgressBarProps) {
  const theme = useTheme();
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: trackColor ?? theme.backgroundSelected },
      ]}
    >
      <View style={{ width: `${pct}%`, height, borderRadius: height / 2, backgroundColor: color ?? theme.primary }} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
});
