import { type ReactElement, type ReactNode } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { IconTileFiller } from '@/components/ui/icon-tile-card';
import { EmptyState } from '@/components/ui/empty-state';
import { LIST_CONTENT_TOP_PADDING } from '@/components/ui/screen-container';
import { Spacing } from '@/constants/theme';

interface TileGridProps<T extends { id: string }> {
  items: T[];
  renderTile: (item: T) => ReactElement;
  emptyMessage: string;
  header?: ReactNode;
}

/**
 * 2-column grid of IconTileCards (same layout as the Activities tab). An odd-length list gets
 * an invisible filler so the last tile keeps its half width instead of stretching.
 */
export function TileGrid<T extends { id: string }>({ items, renderTile, emptyMessage, header }: TileGridProps<T>) {
  const cells: (T | null)[] = items.length % 2 === 0 ? items : [...items, null];
  return (
    <FlatList
      data={cells}
      keyExtractor={(item, index) => item?.id ?? `filler-${index}`}
      renderItem={({ item }) => (item ? renderTile(item) : <IconTileFiller />)}
      numColumns={2}
      columnWrapperStyle={styles.column}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={header ? <>{header}</> : null}
      ListEmptyComponent={<EmptyState message={emptyMessage} />}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.two,
    paddingTop: LIST_CONTENT_TOP_PADDING,
    paddingBottom: Spacing.four,
    flexGrow: 1,
  },
  column: { gap: Spacing.two },
});
