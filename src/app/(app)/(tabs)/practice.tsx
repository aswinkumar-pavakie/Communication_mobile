import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { IconTileCard, IconTileFiller, type TileIcon } from '@/components/ui/icon-tile-card';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Spacing } from '@/constants/theme';

interface PracticeMode {
  href: Href;
  title: string;
  subtitle: string;
  tags: string[];
  icon: TileIcon;
}

const PRACTICE_MODES: PracticeMode[] = [
  {
    href: '/(app)/interviews',
    title: 'Mock Interviews',
    subtitle: 'HR, technical & project',
    tags: ['Speaking', 'Voice'],
    icon: { name: 'account-tie-outline', color: '#0284C7' },
  },
  {
    href: '/(app)/roleplay',
    title: 'Roleplay',
    subtitle: 'Workplace conversations',
    tags: ['Speaking', 'Voice'],
    icon: { name: 'drama-masks', color: '#DB2777' },
  },
  {
    href: '/(app)/debates',
    title: 'Debate',
    subtitle: 'Argue & think critically',
    tags: ['Speaking', 'Voice'],
    icon: { name: 'forum-outline', color: '#DC2626' },
  },
  {
    href: '/(app)/writing',
    title: 'Writing',
    subtitle: 'Professional emails',
    tags: ['Writing'],
    icon: { name: 'pencil-outline', color: '#8B5CF6' },
  },
  {
    href: '/(app)/reports',
    title: 'Reports',
    subtitle: 'Placement readiness',
    tags: ['Insights'],
    icon: { name: 'chart-box-outline', color: '#16A34A' },
  },
];

/** Pairs modes into 2-per-row, padding an odd last row with a filler so every tile stays half-width. */
function toRows(modes: PracticeMode[]): (PracticeMode | null)[][] {
  const rows: (PracticeMode | null)[][] = [];
  for (let i = 0; i < modes.length; i += 2) {
    rows.push([modes[i], modes[i + 1] ?? null]);
  }
  return rows;
}

export default function PracticeScreen() {
  return (
    <ScreenContainer edges={[]}>
      <View style={styles.grid}>
        {toRows(PRACTICE_MODES).map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {row.map((mode, index) =>
              mode ? (
                <IconTileCard
                  key={mode.title}
                  onPress={() => router.push(mode.href)}
                  icon={mode.icon}
                  tags={mode.tags}
                  title={mode.title}
                  subtitle={mode.subtitle}
                />
              ) : (
                <IconTileFiller key={`filler-${index}`} />
              ),
            )}
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  grid: { gap: Spacing.two },
  row: { flexDirection: 'row', gap: Spacing.two },
});
