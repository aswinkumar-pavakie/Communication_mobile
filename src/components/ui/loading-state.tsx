import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <ActivityIndicator color={theme.primary} />
      <ThemedText themeColor="textSecondary" type="small">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 40 },
});
