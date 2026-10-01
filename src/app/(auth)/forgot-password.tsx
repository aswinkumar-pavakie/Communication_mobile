import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { requestPasswordReset, resetPassword } from '@/api/auth';
import { ThemedText } from '@/components/themed-text';
import { BrandMark } from '@/components/ui/brand-mark';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '@/components/ui/error-state';
import { TextField } from '@/components/ui/text-field';
import { useTheme } from '@/hooks/use-theme';
import { tint } from '@/lib/format';

type Step = 'email' | 'code' | 'done';
const RESEND_AFTER_SECONDS = 60;

function PasswordEye({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onToggle} hitSlop={10} accessibilityLabel={visible ? 'Hide password' : 'Show password'}>
      <MaterialCommunityIcons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.textSecondary} />
    </Pressable>
  );
}

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const trimmedEmail = email.trim();
  const emailLooksValid = /^\S+@\S+\.\S+$/.test(trimmedEmail);
  const passwordTooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && confirm !== password;

  async function sendCode() {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await requestPasswordReset(trimmedEmail);
      setStep('code');
      setResendIn(RESEND_AFTER_SECONDS);
      setNotice(`If ${trimmedEmail} has an account, a 6-digit code is on its way. Check your inbox and spam.`);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function submitReset() {
    setError(null);
    setBusy(true);
    try {
      await resetPassword({ email: trimmedEmail, code: code.trim(), newPassword: password });
      setStep('done');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" bounces={false}>
        <View style={[styles.hero, { paddingTop: insets.top + 24 }]}>
          <View pointerEvents="none" style={[styles.circle, styles.circleA]} />
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={[styles.back, { top: insets.top + 12 }]}
            accessibilityLabel="Back to login"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.onPrimary} />
          </Pressable>
          <BrandMark size={60} />
          <ThemedText style={[styles.heroTitle, { color: theme.onPrimary }]}>Reset your password</ThemedText>
        </View>

        <View style={[styles.sheet, { backgroundColor: theme.background, paddingBottom: insets.bottom + 28 }]}>
          {step === 'email' ? (
            <>
              <ThemedText type="small" themeColor="textSecondary">
                Enter the email you log in with. We&apos;ll send you a 6-digit code.
              </ThemedText>
              <TextField
                label="Email"
                icon="email-outline"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                placeholder="you@college.edu"
                returnKeyType="send"
                onSubmitEditing={() => emailLooksValid && !busy && void sendCode()}
              />
            </>
          ) : null}

          {step === 'code' ? (
            <>
              {notice ? (
                <View style={[styles.notice, { backgroundColor: tint(theme.primary, 0.1) }]}>
                  <MaterialCommunityIcons name="email-check-outline" size={18} color={theme.primary} />
                  <ThemedText type="small" style={styles.flex}>
                    {notice}
                  </ThemedText>
                </View>
              ) : null}
              <TextField
                label="6-digit code"
                icon="numeric"
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                placeholder="123456"
                maxLength={6}
              />
              <TextField
                label="New password"
                icon="lock-outline"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                error={passwordTooShort ? 'Use at least 8 characters.' : undefined}
                rightAccessory={<PasswordEye visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
              />
              <TextField
                label="Confirm new password"
                icon="lock-check-outline"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholder="Type it again"
                error={mismatch ? "Passwords don't match." : undefined}
              />
              <Pressable onPress={sendCode} disabled={resendIn > 0 || busy} hitSlop={8}>
                <ThemedText type="smallBold" themeColor={resendIn > 0 ? 'textSecondary' : 'primary'}>
                  {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
                </ThemedText>
              </Pressable>
            </>
          ) : null}

          {step === 'done' ? (
            <View style={styles.done}>
              <View style={[styles.doneIcon, { backgroundColor: tint(theme.success, 0.15) }]}>
                <MaterialCommunityIcons name="check-circle-outline" size={40} color={theme.success} />
              </View>
              <ThemedText style={styles.doneTitle}>Password updated</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                For your security you&apos;ve been signed out of every device. Log in with your new password.
              </ThemedText>
            </View>
          ) : null}

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: tint(theme.danger, 0.1), borderColor: tint(theme.danger, 0.3) }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color={theme.danger} />
              <ThemedText type="small" themeColor="danger" style={styles.flex}>
                {error}
              </ThemedText>
            </View>
          ) : null}

          {step === 'email' ? (
            <Button label="Send code" onPress={sendCode} loading={busy} disabled={!emailLooksValid} />
          ) : null}
          {step === 'code' ? (
            <Button
              label="Set new password"
              onPress={submitReset}
              loading={busy}
              disabled={code.length !== 6 || password.length < 8 || confirm !== password}
            />
          ) : null}
          {step === 'done' ? <Button label="Back to login" onPress={() => router.replace('/(auth)/login')} /> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  scroll: { flexGrow: 1 },
  hero: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 48, gap: 10, overflow: 'hidden' },
  circle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
  circleA: { width: 220, height: 220, top: -80, right: -70 },
  back: { position: 'absolute', left: 16 },
  heroTitle: { fontSize: 22, lineHeight: 28, fontWeight: '800', marginTop: 4 },
  sheet: {
    flexGrow: 1,
    marginTop: -28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 16,
  },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, padding: 12 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12 },
  done: { alignItems: 'center', gap: 10, paddingVertical: 12 },
  doneIcon: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
});
