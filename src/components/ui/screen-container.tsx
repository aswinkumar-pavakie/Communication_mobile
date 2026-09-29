import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';

interface ScreenContainerProps {
  children: ReactNode;
  scroll?: boolean;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
}

/** Standard screen wrapper: safe area + theme background + consistent padding. */
export function ScreenContainer({ children, scroll = true, contentContainerStyle }: ScreenContainerProps) {
  const theme = useTheme();

  if (!scroll) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <View style={[styles.padded, styles.flex]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={[styles.padded, styles.scrollContent, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: { paddingHorizontal: 20, paddingTop: 16 },
  scrollContent: { paddingBottom: 40, gap: 16 },
});
