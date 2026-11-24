import { Link } from 'expo-router';
import type { Metadata } from 'expo-router/server';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/misc';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { AuthShell } from '@/features/auth/auth-shell';
import { friendlyAuthError, isEmail } from '@/lib/auth/errors';
import { useAuth } from '@/providers/auth-provider';

export function generateMetadata(): Metadata {
  return { title: 'Reset password · Abhimanyu' };
}

export default function ForgotPasswordScreen() {
  const { resetPassword, mode } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!isEmail(email)) return setError('Enter the email you registered with');
    setError(null);
    setBusy(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (e) {
      // Do not reveal whether an account exists; only surface real failures.
      const code = (e as { code?: string })?.code;
      if (code === 'auth/user-not-found') setSent(true);
      else setError(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We will email you a link to choose a new one"
      footer={
        <Link href="/login">
          <Text variant="small" weight="medium" tone="accent">
            Back to log in
          </Text>
        </Link>
      }>
      {sent ? (
        <Notice tone="success">
          <Text variant="small">
            {mode === 'demo'
              ? 'Demo mode cannot send email. Once Firebase is connected, a reset link goes to this address.'
              : `If an account exists for ${email.trim()}, a reset link is on its way. Check your inbox and spam folder.`}
          </Text>
        </Notice>
      ) : (
        <>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            error={error}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="send"
            onSubmitEditing={submit}
          />
          <Button label="Send reset link" onPress={submit} loading={busy} fullWidth />
        </>
      )}
    </AuthShell>
  );
}
