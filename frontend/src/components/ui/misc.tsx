import { Info } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Radius, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Text } from './text';

/**
 * The signature detail: a mono evidence reference, e.g. "AR FY25 · p.142".
 * Every claim in the product points at its source.
 */
export function EvidenceTag({ children }: { children: string }) {
  const t = useTheme();
  return (
    <View style={[styles.evidence, { borderColor: t.borderStrong }]}>
      <Text variant="meta" mono tone="textSecondary">
        {children}
      </Text>
    </View>
  );
}

/** Wordmark: the product name, nothing else. */
export function Wordmark({ size = 17 }: { size?: number }) {
  return (
    <Text variant="body" weight="semibold" style={{ fontSize: size, lineHeight: size + 4, letterSpacing: 0.2 }} accessibilityRole="header">
      Abhimanyu
    </Text>
  );
}

/** Thin step progress. */
export function ProgressBar({ value }: { value: number }) {
  const t = useTheme();
  return (
    <View
      style={[styles.track, { backgroundColor: t.border }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}>
      <View style={[styles.fill, { width: `${Math.max(0, Math.min(1, value)) * 100}%`, backgroundColor: t.accent }]} />
    </View>
  );
}

export function Notice({ children, tone = 'info', style }: { children: ReactNode; tone?: ThemeColor; style?: ViewStyle }) {
  const t = useTheme();
  return (
    <View style={[styles.notice, { backgroundColor: t.backgroundElement, borderColor: t.border }, style]}>
      <Info size={16} strokeWidth={1.5} color={t[tone]} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>{typeof children === 'string' ? <Text variant="caption" tone="textSecondary">{children}</Text> : children}</View>
    </View>
  );
}

export function Divider({ style }: { style?: ViewStyle }) {
  const t = useTheme();
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: t.borderStrong }, style]} />;
}

/** Severity is always color + label. */
export function SeverityLabel({ level }: { level: 'low' | 'moderate' | 'elevated' | 'high' }) {
  const t = useTheme();
  const map = {
    low: { label: 'Low', color: t.success },
    moderate: { label: 'Moderate', color: t.warning },
    elevated: { label: 'Elevated', color: t.highRisk },
    high: { label: 'High', color: t.critical },
  } as const;
  const m = map[level];
  return (
    <View style={styles.severity}>
      <View style={[styles.sevDot, { backgroundColor: m.color }]} />
      <Text variant="caption" weight="medium" style={{ color: m.color }}>
        {m.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  evidence: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  track: { height: 3, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 3, borderRadius: 2 },
  notice: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: Radius.md, borderWidth: 1 },
  severity: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sevDot: { width: 8, height: 8, borderRadius: 4 },
});
