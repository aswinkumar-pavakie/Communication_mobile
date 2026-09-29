import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/context/auth-context';
import { queryClient } from '@/lib/query-client';
import { Colors } from '@/constants/theme';

/**
 * React Navigation's own DefaultTheme/DarkTheme use stock colors that don't match this
 * app's palette (Colors in constants/theme.ts) - any chrome that falls back to the
 * navigation theme instead of an explicit useTheme() call (e.g. native header/tab-bar
 * defaults) would otherwise look inconsistent with the rest of the app. Spread the
 * built-in themes as a base (they carry the `fonts` object React Navigation v7 requires)
 * and override only the colors we actually brand.
 */
const AppLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.primary,
    background: Colors.light.background,
    card: Colors.light.backgroundElement,
    text: Colors.light.text,
    border: Colors.light.border,
  },
};

const AppDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.primary,
    background: Colors.dark.background,
    card: Colors.dark.backgroundElement,
    text: Colors.dark.text,
    border: Colors.dark.border,
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemeProvider value={colorScheme === 'dark' ? AppDarkTheme : AppLightTheme}>
              <Stack screenOptions={{ headerShown: false }} />
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
