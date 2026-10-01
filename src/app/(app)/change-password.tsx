import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { changePassword } from '@/api/auth';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiErrorMessage } from '@/components/ui/error-state';
import { ScreenContainer } from '@/components/ui/screen-container';
import { TextField } from '@/components/ui/text-field';
import { useTheme } from '@/hooks/use-theme';
import { persistTokens } from '@/lib/api-client';
import { tint } from '@/lib/format';

export default function ChangePasswordScreen() {
  const theme = useTheme();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const tooShort = next.length > 0 && next.length < 8;
  const mismatch = confirm.length > 0 && confirm !== next;
  const canSubmit = current.length > 0 && next.length >= 8 && confirm === next && !busy;

  async function handleSubmit() {
    setError(null);
    setBusy(true);
    try {
      // Other devices are signed out; the fresh tokens keep *this* phone logged in.
      const tokens = await changePassword({ currentPassword: current, newPassword: next });
      await persistTokens(tokens);
      setDone(true);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const eye = (
    <Pressable onPress={() => setShow((v) => !v)} hitSlop={10} accessibilityLabel={show ? 'Hide passwords' : 'Show passwords'}>
      <MaterialCommunityIcons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.textSecondary} />
    </Pressable>
  );

  if (done) {
    return (
      <ScreenContainer>
        <View style={styles.done}>
          <View style={[styles.doneIcon, { backgroundColor: tint(theme.success, 0.15) }]}>
            <MaterialCommunityIcons name="check-circle-outline" size={40} color={theme.success} />
          </View>
          <ThemedText style={styles.doneTitle}>Password changed</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            You&apos;re still signed in here. Any other phones were signed out for your security.
          </ThemedText>
        </View>
        <Button label="Back to profile" onPress={() => router.back()} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ThemedText type="small" themeColor="textSecondary">
        Use at least 8 characters. Changing your password signs you out on every other device.
      </ThemedText>
      <Card>
        <TextField
          label="Current password"
          icon="lock-outline"
          value={current}
          onChangeText={setCurrent}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoComplete="password"
          rightAccessory={eye}
        />
        <TextField
          label="New password"
          icon="lock-reset"
          value={next}
          onChangeText={setNext}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={tooShort ? 'Use at least 8 characters.' : undefined}
        />
        <TextField
          label="Confirm new password"
          icon="lock-check-outline"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry={!show}
          autoCapitalize="none"
          error={mismatch ? "Passwords don't match." : undefined}
        />
        {error ? (
          <ThemedText type="small" themeColor="danger">
            {error}
          </ThemedText>
        ) : null}
        <Button label="Change password" onPress={handleSubmit} loading={busy} disabled={!canSubmit} />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  done: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  doneIcon: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
});
