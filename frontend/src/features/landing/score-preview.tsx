import { StyleSheet, View } from 'react-native';

import { Divider, EvidenceTag, SeverityLabel } from '@/components/ui/misc';
import { Text } from '@/components/ui/text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Fictional company and data, built to look like the real report the product produces. */
const DOMAINS = [
  { label: 'Accounting quality', score: 82 },
  { label: 'Promoter pledge', score: 71 },
  { label: 'Auditor signals', score: 64 },
  { label: 'Related parties', score: 55 },
  { label: 'Sentiment vs reality', score: 38 },
  { label: 'Order book', score: null },
];

const FLAGS = [
  { text: 'Trade receivables up 41% while revenue rose 9%', source: 'AR FY25 · p.142' },
  { text: 'Pledged promoter shares rose from 12% to 31% in two quarters', source: 'SHP · Sep 2025' },
  { text: 'Possible link: two directors also sit on a key supplier’s board', source: 'MCA-21 · DIN match' },
];

const BANDS = [
  { from: 0, to: 24, label: 'Low' },
  { from: 25, to: 49, label: 'Moderate' },
  { from: 50, to: 74, label: 'Elevated' },
  { from: 75, to: 100, label: 'High' },
];

export function ScorePreview({ compact = false }: { compact?: boolean }) {
  const t = useTheme();
  const score = 68;
  const flags = compact ? FLAGS.slice(0, 2) : FLAGS;
  const domains = compact ? DOMAINS.slice(0, 4) : DOMAINS;

  return (
    <View style={[styles.card, { backgroundColor: 'rgba(18, 26, 34, 0.86)', borderColor: t.borderStrong }]}>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="body" weight="medium">
            Example Textiles Ltd
          </Text>
          <Text variant="meta" mono tone="textMuted">
            NSE: EXTEX · Textiles · FY25
          </Text>
        </View>
        <Text variant="meta" mono tone="textMuted">
          Sample report
        </Text>
      </View>

      <View style={styles.scoreRow}>
        <View style={{ gap: 6 }}>
          <Text variant="caption" tone="textSecondary">
            Red Flag Score
          </Text>
          <View style={styles.figureRow}>
            <Text mono weight="medium" style={styles.figure}>
              {score}
            </Text>
            <Text variant="small" mono tone="textMuted">
              / 100
            </Text>
          </View>
        </View>
        <SeverityLabel level="elevated" />
      </View>

      {/* Band scale with the company's position */}
      <View style={{ gap: 6 }}>
        <View style={styles.bands}>
          {BANDS.map((b) => {
            const active = score >= b.from && score <= b.to;
            return <View key={b.label} style={[styles.band, { backgroundColor: active ? t.highRisk : t.surfaceHover }]} />;
          })}
          <View style={[styles.marker, { left: `${score}%`, backgroundColor: t.text }]} />
        </View>
        <View style={styles.bandLabels}>
          {BANDS.map((b) => (
            <Text key={b.label} variant="meta" mono tone="textMuted">
              {b.from}
            </Text>
          ))}
          <Text variant="meta" mono tone="textMuted">
            100
          </Text>
        </View>
      </View>

      <Divider />

      <View style={{ gap: 10 }}>
        {domains.map((d) => (
          <View key={d.label} style={styles.domainRow}>
            <Text variant="caption" tone="textSecondary" style={styles.domainLabel} numberOfLines={1}>
              {d.label}
            </Text>
            {d.score === null ? (
              <Text variant="meta" mono tone="textMuted" style={{ flex: 1 }}>
                Not analysed: no permitted data source yet
              </Text>
            ) : (
              <>
                <View style={[styles.track, { backgroundColor: t.surfaceHover }]}>
                  <View style={[styles.fill, { width: `${d.score}%`, backgroundColor: d.score === 82 ? t.highRisk : t.textMuted }]} />
                </View>
                <Text variant="meta" mono tone="textSecondary" style={styles.domainScore}>
                  {d.score}
                </Text>
              </>
            )}
          </View>
        ))}
      </View>

      <Divider />

      <View style={{ gap: 12 }}>
        <Text variant="caption" weight="medium" tone="textSecondary">
          Why it was flagged
        </Text>
        {flags.map((f) => (
          <View key={f.text} style={styles.flag}>
            <View style={[styles.flagDot, { backgroundColor: t.highRisk }]} />
            <View style={{ flex: 1, gap: 6 }}>
              <Text variant="small">{f.text}</Text>
              <EvidenceTag>{f.source}</EvidenceTag>
            </View>
          </View>
        ))}
      </View>

      <Text variant="meta" tone="textMuted">
        Fictional company and figures, for illustration. Indicators are for review, not proof of wrongdoing.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: Radius.xl, padding: 24, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  figureRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  figure: { fontSize: 48, lineHeight: 50, letterSpacing: -1 },
  bands: { flexDirection: 'row', gap: 4, height: 6, position: 'relative' },
  band: { flex: 1, borderRadius: 3 },
  marker: { position: 'absolute', top: -4, width: 2, height: 14, borderRadius: 1, marginLeft: -1 },
  bandLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  domainRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 20 },
  domainLabel: { width: 136 },
  track: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
  domainScore: { width: 24, textAlign: 'right' },
  flag: { flexDirection: 'row', gap: 12 },
  flagDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
});
