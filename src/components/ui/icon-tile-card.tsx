import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TileIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface TileIcon {
  name: TileIconName;
  color: string;
}

interface IconTileCardProps {
  icon: TileIcon;
  title: string;
  subtitle: string;
  tags: string[];
  onPress: () => void;
}

/** Every tile is a fixed size so a grid of them lines up exactly, regardless of text length. */
export const TILE_HEIGHT = 220;

/**
 * Blue tile used for the 2-column grids (Activities, Practice): tags on top, a colored icon
 * on a white badge in the middle, title + subtitle pinned to the bottom. Three fixed zones
 * with uniform padding so content can't overflow the tile's bottom edge.
 */
export function IconTileCard({ icon, title, subtitle, tags, onPress }: IconTileCardProps) {
  const theme = useTheme();

  return (
    <Card onPress={onPress} style={[styles.tile, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
      <View style={styles.tagsRow}>
        {tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <ThemedText numberOfLines={1} style={styles.tagText}>
              {tag}
            </ThemedText>
          </View>
        ))}
      </View>
      <View style={styles.iconArea}>
        <View style={styles.iconBadge}>
          <MaterialCommunityIcons name={icon.name} size={30} color={icon.color} />
        </View>
      </View>
      <View style={styles.footer}>
        <ThemedText type="smallBold" numberOfLines={2} style={[styles.title, { color: theme.onPrimary }]}>
          {title}
        </ThemedText>
        <ThemedText numberOfLines={1} style={styles.subtitle}>
          {subtitle}
        </ThemedText>
      </View>
    </Card>
  );
}

/** Invisible same-size placeholder, so an odd-length grid's last tile stays half-width. */
export function IconTileFiller() {
  return <View style={styles.filler} />;
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    height: TILE_HEIGHT,
    padding: 14,
    gap: 0,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  filler: { flex: 1, height: TILE_HEIGHT },
  tagsRow: { flexDirection: 'row', gap: 6, minHeight: 21 },
  tag: {
    flexShrink: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: { color: '#ffffff', fontSize: 11, lineHeight: 15, fontWeight: '600' },
  iconArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  footer: { gap: Spacing.half },
  title: { minHeight: 40 },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 12, lineHeight: 16 },
});
