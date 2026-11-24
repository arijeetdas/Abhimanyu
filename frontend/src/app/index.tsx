import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { StatusPill } from '@/components/status-pill';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useApiHealth } from '@/hooks/use-api-health';
import { useTheme } from '@/hooks/use-theme';
import { API_BASE_URL } from '@/lib/api';

const DOMAINS = [
  { title: 'Related Party Transactions', hint: 'Circular money loops between linked companies' },
  { title: 'Promoter Pledge Anomalies', hint: 'Sudden rises in pledged shares' },
  { title: 'Sentiment vs Reality', hint: 'Upbeat commentary vs auditor notes and cash flows' },
  { title: 'Order Book Spoofing', hint: 'Volume spikes before announcements' },
  { title: 'Accounting Quality', hint: 'Profit without cash, receivables outpacing revenue' },
  { title: 'Auditor Signals', hint: 'Resignations, qualified opinions, going-concern doubts' },
];

export default function OverviewScreen() {
  const theme = useTheme();
  const { health, recheck } = useApiHealth();

  const pill =
    health.state === 'online' ? (
      <StatusPill label={`Online · v${health.version}`} tone="success" />
    ) : health.state === 'offline' ? (
      <StatusPill label="Offline" tone="warning" />
    ) : (
      <StatusPill label="Checking…" tone="info" />
    );

  return (
    <Screen>
      <View style={styles.hero}>
        <ThemedText type="code" themeColor="accent" style={styles.kicker}>
          FORENSIC INTELLIGENCE · NSE / BSE
        </ThemedText>
        <ThemedText type="title">Abhimanyu</ThemedText>
        <ThemedText themeColor="textSecondary">
          Investigate beyond the numbers. Invest beyond the noise.
        </ThemedText>
      </View>

      <Card title="Backend API" right={pill}>
        <ThemedText type="small" themeColor="textSecondary">
          {API_BASE_URL}
        </ThemedText>
        {health.state === 'offline' && (
          <ThemedText type="small" themeColor="textMuted">
            {health.reason}. Start it with{' '}
            <ThemedText type="code" themeColor="text">
              abhi run backend
            </ThemedText>
            {Platform.OS !== 'web' ? ' and keep your phone on the same Wi-Fi.' : '.'}
          </ThemedText>
        )}
        <Pressable
          onPress={recheck}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: pressed ? theme.accentHover : theme.accent },
          ]}>
          <ThemedText type="smallBold" themeColor="onAccent">
            Check again
          </ThemedText>
        </Pressable>
      </Card>

      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
        DETECTION DOMAINS
      </ThemedText>
      <View style={styles.grid}>
        {DOMAINS.map((d) => (
          <Card key={d.title} style={styles.gridItem}>
            <ThemedText type="smallBold">{d.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {d.hint}
            </ThemedText>
          </Card>
        ))}
      </View>

      <ThemedText type="small" themeColor="textMuted" style={styles.disclaimer}>
        Risk indicators are for review only. They do not establish that fraud has occurred and are
        not investment advice.
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: Spacing.two, paddingVertical: Spacing.four },
  kicker: { letterSpacing: 1.5 },
  button: {
    alignSelf: 'flex-start',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginTop: Spacing.one,
  },
  sectionLabel: { letterSpacing: 1.2, marginTop: Spacing.two },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  gridItem: { flexGrow: 1, flexBasis: 260 },
  disclaimer: { marginTop: Spacing.three },
});
