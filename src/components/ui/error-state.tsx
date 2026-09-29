import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { IconBadge } from '@/components/ui/list-row';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong.', onRetry }: ErrorStateProps) {
  const theme = useTheme();
  const isNetwork = /network|timeout|connect/i.test(message);
  return (
    <View style={styles.container}>
      <IconBadge name={isNetwork ? 'wifi-off' : 'alert-circle-outline'} color={theme.danger} size={64} />
      <ThemedText type="smallBold" style={styles.text}>
        {isNetwork ? "Can't reach the server" : 'Something went wrong'}
      </ThemedText>
      <ThemedText themeColor="textSecondary" type="small" style={styles.text}>
        {message}
      </ThemedText>
      {onRetry ? <Button label="Try again" onPress={onRetry} variant="secondary" style={styles.button} /> : null}
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
  container: { alignItems: 'center', gap: 10, paddingVertical: 40, paddingHorizontal: 24 },
  text: { textAlign: 'center' },
  button: { alignSelf: 'stretch', marginTop: 6 },
});
