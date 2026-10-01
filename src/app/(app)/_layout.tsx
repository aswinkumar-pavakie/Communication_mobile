import { Redirect, Stack } from 'expo-router';

import { StreakHeaderBadge } from '@/components/ui/streak-header-badge';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function AppLayout() {
  const { isAuthenticated, isLoading, connectionError } = useAuth();
  const theme = useTheme();

  if (!isLoading && !isAuthenticated) {
    // Offline with a saved session goes to the splash's Retry, not the login form.
    return <Redirect href={connectionError ? '/' : '/(auth)/login'} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: theme.primary },
        headerTintColor: theme.onPrimary,
        headerTitleStyle: { color: theme.onPrimary },
        headerShadowVisible: false,
        // Same streak flame as the tab screens, so it stays visible inside every practice.
        headerRight: () => <StreakHeaderBadge edgeInset />,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="activities/[id]" options={{ headerShown: true, title: 'Activity' }} />
      <Stack.Screen name="interviews/index" options={{ headerShown: true, title: 'Mock Interviews' }} />
      <Stack.Screen name="interviews/[id]" options={{ headerShown: true, title: 'Interview' }} />
      <Stack.Screen name="roleplay/index" options={{ headerShown: true, title: 'Roleplay' }} />
      <Stack.Screen name="roleplay/[id]" options={{ headerShown: true, title: 'Roleplay Session' }} />
      <Stack.Screen name="debates/index" options={{ headerShown: true, title: 'Debates' }} />
      <Stack.Screen name="debates/[id]" options={{ headerShown: true, title: 'Debate Session' }} />
      <Stack.Screen name="writing/index" options={{ headerShown: true, title: 'Writing Practice' }} />
      <Stack.Screen name="writing/[id]" options={{ headerShown: true, title: 'Writing Activity' }} />
      <Stack.Screen name="reports/index" options={{ headerShown: true, title: 'Reports' }} />
      <Stack.Screen name="reports/[id]" options={{ headerShown: true, title: 'Report' }} />
      <Stack.Screen name="streak" options={{ headerShown: true, title: 'Daily Streak' }} />
      <Stack.Screen name="change-password" options={{ headerShown: true, title: 'Change Password' }} />
    </Stack>
  );
}
