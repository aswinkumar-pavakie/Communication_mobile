import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  /** Leading icon inside the field (e.g. email, lock). */
  icon?: ComponentProps<typeof MaterialCommunityIcons>['name'];
  /** Trailing element inside the field (e.g. a show-password toggle). */
  rightAccessory?: ReactNode;
}

export function TextField({ label, error, style, icon, rightAccessory, onFocus, onBlur, ...inputProps }: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? theme.danger : focused ? theme.primary : theme.border;
  const decorated = Boolean(icon || rightAccessory);

  const input = (
    <TextInput
      placeholderTextColor={theme.textSecondary}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[
        styles.input,
        { color: theme.text },
        decorated
          ? styles.bareInput
          : [styles.boxed, { backgroundColor: theme.backgroundElement, borderColor }],
        style,
      ]}
      {...inputProps}
    />
  );

  return (
    <View style={styles.container}>
      {label ? (
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
      ) : null}
      {decorated ? (
        <View style={[styles.boxed, styles.row, { backgroundColor: theme.backgroundElement, borderColor }]}>
          {icon ? (
            <MaterialCommunityIcons name={icon} size={20} color={focused ? theme.primary : theme.textSecondary} />
          ) : null}
          {input}
          {rightAccessory}
        </View>
      ) : (
        input
      )}
      {error ? (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  input: { fontSize: 16 },
  boxed: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 0 },
  bareInput: { flex: 1, paddingVertical: 12 },
});
