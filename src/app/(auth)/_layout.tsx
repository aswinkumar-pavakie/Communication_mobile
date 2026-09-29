import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/context/auth-context';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && isAuthenticated) {
    return <Redirect href="/(app)/(tabs)/home" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
