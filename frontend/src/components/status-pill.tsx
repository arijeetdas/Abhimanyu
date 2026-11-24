import { StyleSheet, View } from 'react-native';

import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from './themed-text';

/** Color + text label together, per the "never color alone" rule. */
export function StatusPill({ label, tone }: { label: string; tone: ThemeColor }) {
  const theme = useTheme();
  const color = theme[tone];
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <ThemedText type="small" style={{ color }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + Spacing.half,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
