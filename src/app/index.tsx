import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BrandMark } from '@/components/ui/brand-mark';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function RootIndex() {
  const theme = useTheme();
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    // Branded splash while the saved session is checked - matches the login header.
    return (
      <View style={[styles.splash, { backgroundColor: theme.primary }]}>
        <BrandMark size={84} />
        <ThemedText style={[styles.name, { color: theme.onPrimary }]}>Communication Assistant</ThemedText>
        <ActivityIndicator color={theme.onPrimary} style={styles.spinner} />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? '/(app)/(tabs)/home' : '/(auth)/login'} />;
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  name: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  spinner: { marginTop: 12 },
});
