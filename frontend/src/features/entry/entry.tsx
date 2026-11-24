import { Redirect } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useAuth } from '@/providers/auth-provider';

/**
 * Android / iOS "/": the app has no landing page. It goes straight to sign-in, onboarding or home.
 * (The website gets entry.web.tsx instead; Metro picks the file per platform.)
 */
export default function Entry() {
  const { status, onboarded } = useAuth();
  if (status === 'loading') return <LoadingScreen />;
  if (status === 'signedOut') return <Redirect href="/login" />;
  return <Redirect href={onboarded ? '/home' : '/onboarding'} />;
}
