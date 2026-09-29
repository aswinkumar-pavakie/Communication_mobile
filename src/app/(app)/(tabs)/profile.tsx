import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const profile = user?.studentProfile;

  return (
    <ScreenContainer>
      <ThemedText type="title" style={styles.title}>
        Profile
      </ThemedText>

      <Card style={styles.card}>
        <ThemedText type="smallBold">
          {profile ? `${profile.firstName} ${profile.lastName}` : user?.email}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {user?.email}
        </ThemedText>
        {profile?.department ? (
          <ThemedText type="small" themeColor="textSecondary">
            {profile.department}
            {profile.year ? ` • Year ${profile.year}` : ''}
            {profile.batch ? ` • ${profile.batch}` : ''}
          </ThemedText>
        ) : null}
      </Card>

      <View style={styles.spacer} />
      <Button label="Log out" onPress={logout} variant="danger" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, lineHeight: 34 },
  card: { gap: Spacing.two },
  spacer: { height: Spacing.two },
});
