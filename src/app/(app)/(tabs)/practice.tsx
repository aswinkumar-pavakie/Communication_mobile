import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Spacing } from '@/constants/theme';

const PRACTICE_MODES = [
  {
    href: '/(app)/interviews' as const,
    title: 'Mock Interviews',
    description: 'Practice HR, technical, and project interviews question by question.',
  },
  {
    href: '/(app)/roleplay' as const,
    title: 'Roleplay',
    description: 'Handle real workplace conversations with an AI partner.',
  },
  {
    href: '/(app)/debates' as const,
    title: 'Debate',
    description: 'Argue a position and sharpen your critical thinking.',
  },
  {
    href: '/(app)/writing' as const,
    title: 'Writing',
    description: 'Practice professional emails and workplace writing.',
  },
  {
    href: '/(app)/reports' as const,
    title: 'Reports',
    description: 'See your placement-readiness reports over time.',
  },
];

export default function PracticeScreen() {
  return (
    <ScreenContainer>
      <ThemedText type="title" style={styles.title}>
        Practice
      </ThemedText>
      <ThemedText themeColor="textSecondary">Choose a mode to sharpen a specific skill.</ThemedText>

      <View style={styles.list}>
        {PRACTICE_MODES.map((mode) => (
          <Card key={mode.href} onPress={() => router.push(mode.href)}>
            <ThemedText type="smallBold">{mode.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {mode.description}
            </ThemedText>
          </Card>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, lineHeight: 34 },
  list: { gap: Spacing.three, marginTop: Spacing.one },
});
