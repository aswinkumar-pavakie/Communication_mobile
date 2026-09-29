import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, onPress, style }: CardProps) {
  const theme = useTheme();
  const themedStyle = [
    styles.base,
    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
    style,
  ];

  if (!onPress) {
    return <View style={themedStyle}>{children}</View>;
  }

  // Layout-affecting styles (flex, height, width, ...) passed via `style` must land on the
  // element that actually participates in the parent's layout - previously they were only
  // applied to an inner View wrapped by an unstyled Pressable, so e.g. flex: 1 inside a grid
  // row had no effect on the Pressable itself, and cards didn't size evenly.
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [...themedStyle, { opacity: pressed ? 0.7 : 1 }]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 8,
  },
});
