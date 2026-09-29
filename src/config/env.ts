import { Platform } from 'react-native';

/**
 * Backend base URL resolution.
 *
 * - Set EXPO_PUBLIC_API_URL to override (e.g. your machine's LAN IP when testing on a
 *   physical device: "http://192.168.1.23:3000/api/v1" - "localhost" only works for
 *   web/iOS simulator, never for a real device or Android emulator).
 * - Android emulator's special loopback alias to the host machine is 10.0.2.2.
 * - Falls back to localhost for web/iOS simulator.
 */
function resolveDefaultApiUrl(): string {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api/v1';
  }
  return 'http://localhost:3000/api/v1';
}

export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ?? resolveDefaultApiUrl();
