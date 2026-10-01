import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type ComponentProps, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { tint } from '@/lib/format';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Colored icon on a soft tint of the same color - the app's standard leading icon. */
export function IconBadge({ name, color, size = 44 }: { name: IconName; color: string; size?: number }) {
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size * 0.32, backgroundColor: tint(color) }]}>
      <MaterialCommunityIcons name={name} size={size * 0.5} color={color} />
    </View>
  );
}

interface ListRowProps {
  icon: IconName;
  iconColor: string;
  title: string;
  subtitle?: string;
  /** Replaces the chevron, e.g. a score badge. */
  right?: ReactNode;
  onPress?: () => void;
  /** Draw as a standalone card (default) or as a plain row inside a grouped card. */
  variant?: 'card' | 'plain';
}

/** Icon + two lines of text + trailing element. Used for lists, menus and feeds. */
export function ListRow({ icon, iconColor, title, subtitle, right, onPress, variant = 'card' }: ListRowProps) {
  const theme = useTheme();
  const isCard = variant === 'card';
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        isCard && [styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }],
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <IconBadge name={icon} color={iconColor} />
      <View style={styles.text}>
        <ThemedText type="smallBold" numberOfLines={2}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2} style={styles.subtitle}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {right ?? (onPress ? <MaterialCommunityIcons name="chevron-right" size={22} color={theme.textSecondary} /> : null)}
    </Pressable>
  );
}

/** Title on the left, optional action link on the right. */
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <ThemedText type="smallBold" themeColor="primary">
            {action}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Small stat card: icon, big value, caption. Lay 2-3 out in a row. Tappable when `onPress` is set. */
export function StatTile({
  icon,
  color,
  value,
  label,
  onPress,
}: {
  icon: IconName;
  color: string;
  value: string;
  label: string;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [
        styles.stat,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <IconBadge name={icon} color={color} size={36} />
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.statLabel}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

/** Rounded pill for metadata (difficulty, trend, status). */
export function Chip({ label, color, icon }: { label: string; color: string; icon?: IconName }) {
  return (
    <View style={[styles.chip, { backgroundColor: tint(color, 0.14) }]}>
      {icon ? <MaterialCommunityIcons name={icon} size={12} color={color} /> : null}
      <ThemedText style={[styles.chipText, { color }]}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  card: { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 },
  text: { flex: 1, gap: 1 },
  subtitle: { fontSize: 13, lineHeight: 18 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  sectionTitle: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  stat: { flex: 1, borderWidth: 1.5, borderRadius: 16, padding: 12, gap: 6 },
  statValue: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  statLabel: { fontSize: 12, lineHeight: 16 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: { fontSize: 12, lineHeight: 16, fontWeight: '700' },
});
