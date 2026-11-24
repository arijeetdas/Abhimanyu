import { Link } from 'expo-router';
import type { Metadata } from 'expo-router/server';
import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/misc';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { AuthShell } from '@/features/auth/auth-shell';
import { friendlyAuthError, isEmail } from '@/lib/auth/errors';
import { useAuth } from '@/providers/auth-provider';

export function generateMetadata(): Metadata {
  return { title: 'Log in · Abhimanyu' };
}

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  const submit = async () => {
    const next = {
      email: isEmail(email) ? undefined : 'Enter the email you registered with',
      password: password ? undefined : 'Enter your password',
    };
    setErrors(next);
    setFormError(null);
    if (next.email || next.password) return;
    setBusy(true);
    try {
      await signIn(email, password);
      // The router guard moves you to onboarding or home once the session is active.
    } catch (e) {
      setFormError(friendlyAuthError(e));
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Log in"
      subtitle="Pick up your investigations where you left them"
      footer={
        <Text variant="small" tone="textSecondary">
          New to Abhimanyu?{' '}
          <Link href="/register">
            <Text variant="small" weight="medium" tone="accent">
              Create an account
            </Text>
          </Link>
        </Text>
      }>
      <View style={styles.fields}>
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <TextField
          ref={passwordRef}
          label="Password"
          password
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        <Link href="/forgot-password" asChild>
          <Pressable accessibilityRole="link" style={styles.forgot}>
            <Text variant="caption" weight="medium" tone="textSecondary">
              Forgot password?
            </Text>
          </Pressable>
        </Link>
      </View>
      {formError && <Notice tone="critical">{formError}</Notice>}
      <Button label="Log in" onPress={submit} loading={busy} fullWidth />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 16 },
  forgot: { alignSelf: 'flex-end', paddingVertical: 4 },
});
