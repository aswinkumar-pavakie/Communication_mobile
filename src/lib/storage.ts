import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * expo-secure-store has no web support at all, so auth tokens fall back to
 * AsyncStorage there. That's strictly less secure (it's not encrypted at rest), but
 * this app's web target is a dev/demo convenience, not the primary distribution channel -
 * native (iOS/Android) always gets the encrypted keychain/keystore-backed store.
 */
const isWeb = Platform.OS === 'web';

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    return isWeb ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (isWeb) {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  async removeItem(key: string): Promise<void> {
    if (isWeb) {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export const STORAGE_KEYS = {
  accessToken: 'communication_assistant.access_token',
  refreshToken: 'communication_assistant.refresh_token',
} as const;
