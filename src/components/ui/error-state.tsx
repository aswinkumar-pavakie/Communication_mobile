import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/themed-text';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong.', onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <ThemedText themeColor="danger" type="small" style={styles.text}>
        {message}
      </ThemedText>
      {onRetry ? <Button label="Try again" onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

/** Extracts a readable message from an axios error, falling back to a generic one. */
export function apiErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response
  ) {
    const data = (error.response as { data?: { message?: string } }).data;
    if (data?.message) return data.message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  text: { textAlign: 'center' },
});
