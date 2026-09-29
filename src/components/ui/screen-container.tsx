import { type ReactNode, type Ref } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';

interface ScreenContainerProps {
  children: ReactNode;
  scroll?: boolean;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  /**
   * Which safe-area edges this screen still needs to reserve space for itself.
   * Defaults to just "bottom" - every screen using ScreenContainer has a native header
   * (which already insets the top for the status bar), so reserving "top" here too would
   * double that space and show up as a blank gap below the header. Tab screens sit above
   * the tab bar too, so they don't need "bottom" either - pass edges={[]} for those.
   * Screens with neither a header nor a tab bar (e.g. login) should pass ['top', 'bottom'].
   */
  edges?: Edge[];
  /** Lets chat-style screens scroll to the newest message. Only used when `scroll` is true. */
  scrollRef?: Ref<ScrollView>;
}

/** Standard screen wrapper: safe area + theme background + consistent padding. */
export function ScreenContainer({
  children,
  scroll = true,
  contentContainerStyle,
  edges = ['bottom'],
  scrollRef,
}: ScreenContainerProps) {
  const theme = useTheme();

  if (!scroll) {
    // Horizontal padding only: a non-scrolling wrapper usually holds a FlatList, and top
    // padding here would be a fixed band that list items scroll under and get clipped at,
    // showing as a permanent gap below the header. Lists add their own top padding via
    // contentContainerStyle (LIST_CONTENT_TOP_PADDING) so it scrolls away with the content.
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={edges}>
        <View style={[styles.paddedHorizontal, styles.flex]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={edges}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.padded, styles.scrollContent, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        // iOS: keep the focused answer box above the keyboard (Android resizes the window itself).
        automaticallyAdjustKeyboardInsets
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Top padding for FlatLists inside a `scroll={false}` ScreenContainer - see note above. */
export const LIST_CONTENT_TOP_PADDING = 16;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: { paddingHorizontal: 20, paddingTop: 16 },
  paddedHorizontal: { paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 40, gap: 16 },
});
