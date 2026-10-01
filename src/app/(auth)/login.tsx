import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BrandMark } from '@/components/ui/brand-mark';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '@/components/ui/error-state';
import { IconBadge, type IconName } from '@/components/ui/list-row';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { tint } from '@/lib/format';

const FEATURES: { icon: IconName; color: string; label: string }[] = [
  { icon: 'microphone-outline', color: '#0284C7', label: 'Speak' },
  { icon: 'star-four-points-outline', color: '#8B5CF6', label: 'Get AI feedback' },
  { icon: 'chart-line', color: '#16A34A', label: 'Improve' },
];

export default function LoginScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" bounces={false}>
        {/* Brand header */}
        <View style={[styles.hero, { paddingTop: insets.top + 36 }]}>
          <View pointerEvents="none" style={[styles.circle, styles.circleA]} />
          <View pointerEvents="none" style={[styles.circle, styles.circleB]} />
          <BrandMark size={72} />
          <ThemedText style={[styles.appName, { color: theme.onPrimary }]}>Communication Assistant</ThemedText>
          <ThemedText style={[styles.tagline, { color: theme.onPrimary }]}>
            Practice speaking. Get instant AI feedback.{'\n'}Become placement ready.
          </ThemedText>
        </View>

        {/* Form sheet */}
        <View style={[styles.sheet, { backgroundColor: theme.background, paddingBottom: insets.bottom + 28 }]}>
          <View>
            <ThemedText style={styles.welcome}>Welcome back</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Log in to continue your practice streak.
            </ThemedText>
          </View>

          <TextField
            label="Email"
            icon="email-outline"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@college.edu"
            returnKeyType="next"
          />
          <TextField
            label="Password"
            icon="lock-outline"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password"
            placeholder="Enter your password"
            returnKeyType="go"
            onSubmitEditing={() => {
              if (email && password && !isSubmitting) void handleSubmit();
            }}
            rightAccessory={
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={10}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={theme.textSecondary}
                />
              </Pressable>
            }
          />

          <Link href="/(auth)/forgot-password" asChild>
            <Pressable hitSlop={8} style={styles.forgot}>
              <ThemedText type="smallBold" themeColor="primary">
                Forgot password?
              </ThemedText>
            </Pressable>
          </Link>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: tint(theme.danger, 0.1), borderColor: tint(theme.danger, 0.3) }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color={theme.danger} />
              <ThemedText type="small" themeColor="danger" style={styles.flex}>
                {error}
              </ThemedText>
            </View>
          ) : null}

          <Button label="Log in" onPress={handleSubmit} loading={isSubmitting} disabled={!email || !password} />

          <View style={styles.features}>
            {FEATURES.map((f) => (
              <View key={f.label} style={styles.feature}>
                <IconBadge name={f.icon} color={f.color} size={40} />
                <ThemedText type="small" themeColor="textSecondary" style={styles.featureLabel}>
                  {f.label}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  hero: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 56, gap: 10, overflow: 'hidden' },
  circle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
  circleA: { width: 260, height: 260, top: -90, right: -90 },
  circleB: { width: 160, height: 160, bottom: -40, left: -60 },
  appName: { fontSize: 24, lineHeight: 30, fontWeight: '800', marginTop: 6 },
  tagline: { fontSize: 14, lineHeight: 20, textAlign: 'center', opacity: 0.9 },
  sheet: {
    flexGrow: 1,
    marginTop: -28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 16,
  },
  welcome: { fontSize: 26, lineHeight: 32, fontWeight: '800' },
  forgot: { alignSelf: 'flex-end', marginTop: -6 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12 },
  features: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  feature: { alignItems: 'center', gap: 6 },
  featureLabel: { fontSize: 12 },
});
