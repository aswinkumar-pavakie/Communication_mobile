import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconBadge, type IconName } from '@/components/ui/list-row';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface EmptyStateProps {
  message: string;
  title?: string;
  icon?: IconName;
}

/** Shown in place of a list's contents when a real query legitimately returns zero items. */
export function EmptyState({ message, title = 'Nothing here yet', icon = 'inbox-outline' }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <IconBadge name={icon} color={theme.primary} size={64} />
      <ThemedText type="smallBold" style={styles.text}>
        {title}
      </ThemedText>
      <ThemedText themeColor="textSecondary" type="small" style={styles.text}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: Spacing.five, paddingHorizontal: Spacing.four, gap: Spacing.two },
  text: { textAlign: 'center' },
});
