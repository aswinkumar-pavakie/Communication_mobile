import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const theme = useTheme();

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: theme.backgroundElement },
        headerTintColor: theme.text,
        headerTitleStyle: { color: theme.text },
        headerShadowVisible: false,
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
    </Stack>
  );
}
