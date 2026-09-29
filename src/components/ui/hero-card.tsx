import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

/** The blue headline card (score summaries, profile header). Soft circles add depth without an image. */
export function HeroCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <View style={[styles.hero, { backgroundColor: theme.primary }, style]}>
      <View pointerEvents="none" style={[styles.circle, styles.circleA]} />
      <View pointerEvents="none" style={[styles.circle, styles.circleB]} />
      {children}
    </View>
  );
}

/** Big score inside a translucent ring - readable on the blue hero in light and dark mode. */
export function HeroScore({ score, label = '/100', size = 88 }: { score: number; label?: string; size?: number }) {
  const theme = useTheme();
  return (
    <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}>
      <ThemedText style={[styles.ringValue, { color: theme.onPrimary }]}>{Math.round(score)}</ThemedText>
      <ThemedText style={[styles.ringLabel, { color: theme.onPrimary }]}>{label}</ThemedText>
    </View>
  );
}

/** Small translucent pill for text on the hero. */
export function HeroPill({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.pill}>
      <ThemedText style={[styles.pillText, { color: theme.onPrimary }]}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 22, padding: 20, gap: 14, overflow: 'hidden' },
  circle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
  circleA: { width: 190, height: 190, top: -70, right: -55 },
  circleB: { width: 120, height: 120, bottom: -55, left: -35 },
  ring: {
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: { fontSize: 30, lineHeight: 34, fontWeight: '800' },
  ringLabel: { fontSize: 11, lineHeight: 13, fontWeight: '600', opacity: 0.85 },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: { fontSize: 12, lineHeight: 16, fontWeight: '700' },
});
