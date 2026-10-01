import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BrandMark } from '@/components/ui/brand-mark';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function RootIndex() {
  const theme = useTheme();
  const { isLoading, isAuthenticated, connectionError, retry } = useAuth();

  if (isLoading || connectionError) {
    // Branded splash while the saved session is checked - matches the login header. If the
    // server can't be reached, stay signed in and let the student retry.
    return (
      <View style={[styles.splash, { backgroundColor: theme.primary }]}>
        <BrandMark size={84} />
        <ThemedText style={[styles.name, { color: theme.onPrimary }]}>Communication Assistant</ThemedText>
        {connectionError ? (
          <View style={styles.offline}>
            <MaterialCommunityIcons name="wifi-off" size={22} color={theme.onPrimary} />
            <ThemedText style={[styles.offlineText, { color: theme.onPrimary }]}>
              Can&apos;t reach the server. Check your connection.
            </ThemedText>
            <Pressable
              onPress={retry}
              style={({ pressed }) => [styles.retry, { backgroundColor: theme.onPrimary, opacity: pressed ? 0.8 : 1 }]}
            >
              <ThemedText type="smallBold" style={{ color: theme.primary }}>
                Retry
              </ThemedText>
            </Pressable>
          </View>
        ) : (
          <ActivityIndicator color={theme.onPrimary} style={styles.spinner} />
        )}
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? '/(app)/(tabs)/home' : '/(auth)/login'} />;
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  name: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  spinner: { marginTop: 12 },
  offline: { alignItems: 'center', gap: 10, marginTop: 12 },
  offlineText: { fontSize: 14, textAlign: 'center', opacity: 0.95 },
  retry: { paddingHorizontal: 28, paddingVertical: 10, borderRadius: 999, marginTop: 4 },
});
