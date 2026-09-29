import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { MessageRole } from '@/types/api';

interface ChatBubbleProps {
  role: MessageRole;
  content: string;
}

export function ChatBubble({ role, content }: ChatBubbleProps) {
  const theme = useTheme();
  const isUser = role === 'USER';
  if (role === 'SYSTEM') return null;

  return (
    <View style={[styles.row, isUser ? styles.rowEnd : styles.rowStart]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? theme.primary : theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}
      >
        <ThemedText style={{ color: isUser ? theme.onPrimary : theme.text }}>{content}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: 4 },
  rowStart: { justifyContent: 'flex-start' },
  rowEnd: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
