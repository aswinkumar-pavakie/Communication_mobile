import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/** App logo: a speaking-person glyph in a white rounded square - used on login and the splash. */
export function BrandMark({ size = 72 }: { size?: number }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.mark,
        { width: size, height: size, borderRadius: size * 0.3, backgroundColor: theme.onPrimary },
      ]}
    >
      <MaterialCommunityIcons name="account-voice" size={size * 0.55} color={theme.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
