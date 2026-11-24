import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import { IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold, useFonts } from '@expo-google-fonts/ibm-plex-sans';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/providers/auth-provider';

if (Platform.OS !== 'web') SplashScreen.preventAutoHideAsync().catch(() => undefined);

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.dark.background,
    card: Colors.dark.backgroundElement,
    border: Colors.dark.border,
    text: Colors.dark.text,
    primary: Colors.dark.accent,
  },
};

/**
 * Route map
 *   /              web: landing page (index.web.tsx)    app: redirect (index.tsx)
 *   /login /register /forgot-password                  signed-out only
 *   /onboarding                                        signed in, onboarding not finished
 *   /home                                              signed in and onboarded
 * While the session is still loading every guard stays open, so static pages render and each
 * screen shows its own loading state; once known, wrong screens redirect to the right place.
 */
function RootNavigator() {
  const { status, onboarded } = useAuth();
  const ready = status !== 'loading';
  const signedIn = status === 'signedIn';

  useEffect(() => {
    if (ready && Platform.OS !== 'web') SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.dark.background }, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!ready || !signedIn} redirectTo={onboarded ? '/home' : '/onboarding'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={!ready || (signedIn && !onboarded)} redirectTo={signedIn ? '/home' : '/login'}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={!ready || (signedIn && onboarded)} redirectTo={signedIn ? '/onboarding' : '/login'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  // Native waits for fonts behind the splash screen; web renders at once and swaps fonts in.
  if (Platform.OS !== 'web' && !fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style="light" />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
