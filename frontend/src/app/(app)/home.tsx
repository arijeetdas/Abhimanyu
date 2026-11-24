import type { Metadata } from 'expo-router/server';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ShaderBackdrop } from '@/components/backdrop/shader-backdrop';
import { LoadingScreen } from '@/components/loading-screen';
import { Button } from '@/components/ui/button';
import { Divider, Wordmark } from '@/components/ui/misc';
import { Text } from '@/components/ui/text';
import { Motion, Radius } from '@/constants/theme';
import { useApiHealth } from '@/hooks/use-api-health';
import { useTheme } from '@/hooks/use-theme';
import { DIGESTS, labelOf, ROLES, SEVERITIES } from '@/lib/profile/options';
import { useAuth } from '@/providers/auth-provider';

export function generateMetadata(): Metadata {
  return { title: 'Home · Abhimanyu' };
}

/**
 * PLACEHOLDER home screen. The real dashboard gets designed later; for now this confirms that
 * register / log in and onboarding worked, on the same animated backdrop as the landing page.
 */
export default function HomeScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { status, user, profile, mode, signOut, restartOnboarding } = useAuth();
  const { health, recheck } = useApiHealth();

  if (status !== 'signedIn' || !profile) return <LoadingScreen />;

  const rows: [string, string][] = [
    ['Signed in as', user?.email ?? ''],
    ['Role', labelOf(ROLES, profile.role) ?? 'Not set'],
    ['Watchlist', profile.watchlist.length ? profile.watchlist.slice(0, 5).join(', ') + (profile.watchlist.length > 5 ? ` +${profile.watchlist.length - 5}` : '') : 'Empty'],
    ['Alerts', `${labelOf(SEVERITIES, profile.notificationPrefs.min_severity)} · ${labelOf(DIGESTS, profile.notificationPrefs.digest)}`],
    ['Account', mode === 'firebase' ? 'Firebase' : 'Demo (this device only)'],
  ];

  const api = health.state === 'online' ? { label: `Online · v${health.version}`, tone: t.success } : health.state === 'offline' ? { label: 'Offline', tone: t.warning } : { label: 'Checking', tone: t.info };

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <ShaderBackdrop preset="hero" />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.top}>
          <Wordmark />
          <Button label="Sign out" size="sm" variant="secondary" onPress={() => signOut()} />
        </View>

        <Animated.View entering={FadeInDown.duration(Motion.enter).easing(Motion.easing)} style={[styles.card, { backgroundColor: 'rgba(18, 26, 34, 0.82)', borderColor: t.borderStrong }]}>
          <View style={{ gap: 8 }}>
            <Text variant="meta" mono tone="textMuted">
              Placeholder home
            </Text>
            <Text variant="title" accessibilityRole="header">
              Successful
            </Text>
            <Text variant="body" tone="textSecondary">
              {`You are signed in and set up, ${profile.displayName.split(' ')[0] || 'investigator'}. The real home screen with reports and alerts is being designed next.`}
            </Text>
          </View>

          <View style={{ gap: 10 }}>
            {rows.map(([k, v], i) => (
              <View key={k}>
                {i > 0 && <Divider style={{ marginBottom: 10 }} />}
                <View style={styles.row}>
                  <Text variant="caption" tone="textMuted" style={styles.rowKey}>
                    {k}
                  </Text>
                  <Text variant="small" style={{ flex: 1 }} numberOfLines={1}>
                    {v}
                  </Text>
                </View>
              </View>
            ))}
            <Divider />
            <View style={styles.row}>
              <Text variant="caption" tone="textMuted" style={styles.rowKey}>
                Backend API
              </Text>
              <View style={styles.status}>
                <View style={[styles.dot, { backgroundColor: api.tone }]} />
                <Text variant="small" style={{ color: api.tone }}>
                  {api.label}
                </Text>
              </View>
              <Button label="Check" size="sm" variant="ghost" onPress={recheck} />
            </View>
          </View>

          <View style={styles.actions}>
            <Button label="Redo onboarding" variant="secondary" onPress={() => restartOnboarding()} />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 20, gap: 32 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 1200, alignSelf: 'center' },
  card: { width: '100%', maxWidth: 520, alignSelf: 'center', marginVertical: 'auto', borderWidth: 1, borderRadius: Radius.xl, padding: 28, gap: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 24 },
  rowKey: { width: 104 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
