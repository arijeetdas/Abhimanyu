import { Link } from 'expo-router';
import type { Metadata } from 'expo-router/server';
import { useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { CheckRow } from '@/components/ui/choice';
import { Notice } from '@/components/ui/misc';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { AuthShell } from '@/features/auth/auth-shell';
import { friendlyAuthError, isEmail, passwordProblem, passwordStrength } from '@/lib/auth/errors';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/providers/auth-provider';

export function generateMetadata(): Metadata {
  return { title: 'Create account · Abhimanyu' };
}

const STRENGTH = ['Too weak', 'Fair', 'Good', 'Strong'] as const;

export default function RegisterScreen() {
  const t = useTheme();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; terms?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<ComponentRef<typeof TextInput>>(null);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  const strength = passwordStrength(password);
  const strengthColor = [t.critical, t.warning, t.success, t.success][strength];

  const submit = async () => {
    const next = {
      name: name.trim().length >= 2 ? undefined : 'Enter your name',
      email: isEmail(email) ? undefined : 'Enter a valid email address',
      password: passwordProblem(password) ?? undefined,
      terms: terms ? undefined : 'Please accept the terms to continue',
    };
    setErrors(next);
    setFormError(null);
    if (Object.values(next).some(Boolean)) return;
    setBusy(true);
    try {
      await register({ name, email, password });
      // The router guard opens onboarding as soon as the account exists.
    } catch (e) {
      setFormError(friendlyAuthError(e));
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Then a short setup tailors reports and alerts to how you invest"
      footer={
        <Text variant="small" tone="textSecondary">
          Already registered?{' '}
          <Link href="/login">
            <Text variant="small" weight="medium" tone="accent">
              Log in
            </Text>
          </Link>
        </Text>
      }>
      <View style={styles.fields}>
        <TextField
          label="Full name"
          value={name}
          onChangeText={setName}
          error={errors.name}
          autoComplete="name"
          textContentType="name"
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
        <TextField
          ref={emailRef}
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
        <View style={{ gap: 8 }}>
          <TextField
            ref={passwordRef}
            label="Password"
            password
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            hint="At least 8 characters, with letters and numbers"
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          {password.length > 0 && (
            <View style={styles.strength} accessibilityLabel={`Password strength: ${STRENGTH[strength]}`}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[styles.strengthBar, { backgroundColor: i < Math.max(1, strength) ? strengthColor : t.surfaceHover }]} />
              ))}
              <Text variant="meta" tone="textMuted" style={{ marginLeft: 4 }}>
                {STRENGTH[strength]}
              </Text>
            </View>
          )}
        </View>
        <CheckRow checked={terms} onToggle={() => setTerms((v) => !v)} error={!!errors.terms}>
          <Text variant="caption" tone="textSecondary">
            I agree to the Terms of Service and Privacy Policy, and to Abhimanyu storing my account details to run the service
          </Text>
          {errors.terms && (
            <Text variant="caption" tone="critical">
              {errors.terms}
            </Text>
          )}
        </CheckRow>
      </View>
      {formError && <Notice tone="critical">{formError}</Notice>}
      <Button label="Create account" onPress={submit} loading={busy} fullWidth />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 16 },
  strength: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2, maxWidth: 64 },
});
