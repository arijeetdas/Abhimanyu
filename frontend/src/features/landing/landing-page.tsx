import { useRef, useState, type ComponentRef } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ShaderBackdrop } from '@/components/backdrop/shader-backdrop';
import { Button } from '@/components/ui/button';
import { Divider, EvidenceTag, Wordmark } from '@/components/ui/misc';
import { Text } from '@/components/ui/text';
import { Motion, Radius } from '@/constants/theme';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';
import { DOMAINS } from '@/lib/profile/options';
import { useAuth } from '@/providers/auth-provider';

import { ScorePreview } from './score-preview';

const STEPS = [
  { n: '01', title: 'Collect', text: 'Annual reports, auditor notes, shareholding patterns and announcements from BSE, NSE and MCA-21.' },
  { n: '02', title: 'Read', text: 'Every relevant passage is extracted with its page reference, so each finding can be checked at the source.' },
  { n: '03', title: 'Connect and test', text: 'Directors and promoters are mapped across companies, and the numbers go through forensic checks like the Beneish M-Score.' },
  { n: '04', title: 'Score and explain', text: 'One Red Flag Score from 0 to 100, broken down by domain, with plain-language reasons and the evidence behind each.' },
];

const AGENTS = [
  { name: 'DocSynthesizer', role: 'Reads annual reports and auditor notes, returns findings with exact page references' },
  { name: 'Forensic Accounting', role: 'Beneish M-Score, cash flow vs profit divergence, earnings-quality checks' },
  { name: 'Network Graph', role: 'Maps director and promoter links, finds circular money flows' },
  { name: 'Microstructure Fraud', role: 'Spots order book spoofing and suspicious volume before announcements' },
  { name: 'Meta CIO', role: 'Combines every signal, resolves conflicts, writes the final report' },
];

const RULES = [
  'No flag is shown without evidence',
  'Findings are risk indicators for review, never accusations',
  'Relationships the system infers are labelled as possible links until verified',
  'Missing data is reported as missing, never guessed',
  'Analysts can confirm or dismiss flags, and that feedback improves the system',
];

const web = Platform.OS === 'web';

export function LandingPage() {
  const t = useTheme();
  const { isDesktop, isTablet, mounted } = useLayout();
  const { status, onboarded } = useAuth();
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const [offsets, setOffsets] = useState<Record<string, number>>({});

  const signedIn = status === 'signedIn';
  const appHref = onboarded ? '/home' : '/onboarding';
  const pad = isDesktop ? 48 : isTablet ? 32 : 20;
  const jump = (id: string) => scroller.current?.scrollTo({ y: Math.max(0, (offsets[id] ?? 0) - 24), animated: true });
  const mark = (id: string) => ({
    onLayout: (e: { nativeEvent: { layout: { y: number } } }) => {
      const y = e.nativeEvent.layout.y;
      setOffsets((o) => (o[id] === y ? o : { ...o, [id]: y }));
    },
  });

  const container: ViewStyle = { width: '100%', maxWidth: 1200, alignSelf: 'center', paddingHorizontal: pad };

  return (
    <ScrollView ref={scroller} style={{ backgroundColor: t.background }} contentContainerStyle={{ flexGrow: 1 }}>
      {/* Hero */}
      <View style={[styles.hero, web && ({ minHeight: '100vh' } as unknown as ViewStyle)]}>
        <ShaderBackdrop preset="hero" scrim={isDesktop ? 'left' : 'veil'} />

        <View style={[container, styles.nav]}>
          <Wordmark />
          {isDesktop && (
            <View style={styles.navLinks}>
              {[
                ['how', 'How it works'],
                ['domains', 'Red flags'],
                ['rules', 'Safety rules'],
              ].map(([id, label]) => (
                <Pressable key={id} onPress={() => jump(id)} accessibilityRole="link" style={styles.navLink}>
                  <Text variant="small" tone="textSecondary">
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          <View style={styles.navActions}>
            {signedIn ? (
              <Button label="Open Abhimanyu" size="sm" href={appHref} />
            ) : (
              <>
                <Button label="Log in" size="sm" variant="ghost" href="/login" />
                <Button label="Register" size="sm" href="/register" />
              </>
            )}
          </View>
        </View>

        <View style={[container, styles.heroBody, isDesktop && styles.heroBodyDesktop]}>
          <Animated.View
            entering={mounted ? FadeInDown.duration(Motion.enter).easing(Motion.easing).withInitialValues({ transform: [{ translateY: 10 }] }) : undefined}
            style={[styles.heroText, isDesktop && { flex: 1, maxWidth: 600 }]}>
            <Text variant="meta" mono tone="textSecondary">
              NSE · BSE · Forensic intelligence
            </Text>
            <Text variant={isTablet ? 'display' : 'displayMobile'} accessibilityRole="header">
              Read the filings before you buy the stock
            </Text>
            <Text variant="subhead" tone="textSecondary" style={{ maxWidth: 520 }}>
              Abhimanyu reads annual reports, auditor notes and exchange disclosures, maps promoter and director links, and gives every
              company an explainable Red Flag Score from 0 to 100.
            </Text>
            <View style={styles.ctaRow}>
              {signedIn ? (
                <Button label="Open Abhimanyu" href={appHref} />
              ) : (
                <>
                  <Button label="Create account" href="/register" />
                  <Button label="Log in" variant="secondary" href="/login" />
                </>
              )}
            </View>
            <View style={styles.heroNote}>
              <EvidenceTag>AR FY25 · p.142</EvidenceTag>
              <Text variant="caption" tone="textSecondary" style={{ flex: 1 }}>
                Every flag points to the filing page, metric or relationship behind it
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            entering={mounted ? FadeInDown.delay(Motion.stagger * 2).duration(Motion.enter).easing(Motion.easing).withInitialValues({ transform: [{ translateY: 12 }] }) : undefined}
            style={[isDesktop ? { width: 460 } : { width: '100%', maxWidth: 520 }]}>
            <ScorePreview compact={!isTablet} />
          </Animated.View>
        </View>
      </View>

      {/* How it works */}
      <View {...mark('how')} style={[container, styles.section]}>
        <SectionHead
          title="How an investigation runs"
          text="A team of specialist AI agents works through the same documents a forensic accountant would, in minutes instead of weeks."
        />
        <View style={[styles.grid, { gap: isDesktop ? 32 : 24 }]}>
          {STEPS.map((s) => (
            <View key={s.n} style={[styles.step, { flexBasis: isDesktop ? 0 : isTablet ? '45%' : '100%' }]}>
              <Text variant="meta" mono tone="accent">
                {s.n}
              </Text>
              <Text variant="heading">{s.title}</Text>
              <Text variant="small" tone="textSecondary">
                {s.text}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Domains */}
      <View {...mark('domains')} style={[container, styles.section]}>
        <SectionHead title="Six places trouble tends to hide" text="Each domain is scored on its own, so you can see exactly where the risk comes from." />
        <View style={[styles.domainGrid, { borderColor: t.border }]}>
          {DOMAINS.map((d, i) => (
            <View
              key={d.value}
              style={[
                styles.domainCell,
                { borderColor: t.border, width: isDesktop ? '33.333%' : isTablet ? '50%' : '100%', minHeight: isTablet ? 180 : undefined },
                !isTablet && i === DOMAINS.length - 1 && { borderBottomWidth: 0 },
              ]}>
              <Text variant="body" weight="medium">
                {d.title}
              </Text>
              <Text variant="small" tone="textSecondary" style={{ flex: 1 }}>
                {d.description}
              </Text>
              <EvidenceTag>{d.source}</EvidenceTag>
            </View>
          ))}
        </View>
      </View>

      {/* Agents */}
      <View style={[container, styles.section, isDesktop && styles.split]}>
        <View style={isDesktop ? { width: 360 } : undefined}>
          <SectionHead title="The detective team" text="Specialists work in parallel, then the Meta CIO weighs their findings against each other." />
        </View>
        <View style={{ flex: 1 }}>
          {AGENTS.map((a, i) => (
            <View key={a.name}>
              {i > 0 && <Divider />}
              <View style={[styles.agentRow, !isTablet && { flexDirection: 'column', gap: 4 }]}>
                <Text variant="body" weight="medium" style={isTablet ? { width: 200 } : undefined}>
                  {a.name}
                </Text>
                <Text variant="small" tone="textSecondary" style={{ flex: 1 }}>
                  {a.role}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Safety rules */}
      <View {...mark('rules')} style={[container, styles.section, isDesktop && styles.split]}>
        <View style={isDesktop ? { width: 360 } : undefined}>
          <SectionHead title="Built-in safety rules" text="Abhimanyu is designed to inform a decision, not to make one for you." />
        </View>
        <View style={{ flex: 1, gap: 16 }}>
          {RULES.map((r, i) => (
            <View key={r} style={styles.rule}>
              <Text variant="small" mono tone="textMuted" style={{ width: 24 }}>
                {String(i + 1).padStart(2, '0')}
              </Text>
              <Text variant="body" style={{ flex: 1 }}>
                {r}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Closing call to action */}
      <View style={[container, styles.section]}>
        <View style={[styles.cta, { backgroundColor: t.backgroundElement, borderColor: t.border }, isDesktop && styles.ctaDesktop]}>
          <View style={{ flex: 1, gap: 8 }}>
            <Text variant="title">Set up your watchlist</Text>
            <Text variant="body" tone="textSecondary">
              Create an account, tell us what you invest in, and choose which red flags should reach you. It takes about two minutes.
            </Text>
          </View>
          <View style={styles.ctaRow}>
            {signedIn ? (
              <Button label="Open Abhimanyu" href={appHref} />
            ) : (
              <>
                <Button label="Create account" href="/register" />
                <Button label="Log in" variant="secondary" href="/login" />
              </>
            )}
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={[container, styles.footer]}>
        <Divider />
        <View style={[styles.footerRow, !isTablet && { flexDirection: 'column', alignItems: 'flex-start' }]}>
          <View style={{ gap: 8, flex: 1 }}>
            <Wordmark size={15} />
            <Text variant="caption" tone="textMuted" style={{ maxWidth: 640 }}>
              Abhimanyu is an experimental research platform. Detected anomalies and risk indicators do not establish that fraud has occurred,
              AI findings should be independently verified, and nothing here is investment advice.
            </Text>
          </View>
          <Text variant="caption" mono tone="textMuted">
            © 2026 Abhimanyu team
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function SectionHead({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.sectionHead}>
      <Text variant="title" accessibilityRole="header">
        {title}
      </Text>
      <Text variant="body" tone="textSecondary" style={{ maxWidth: 560 }}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { minHeight: 760, paddingBottom: 64, overflow: 'hidden' },
  nav: { flexDirection: 'row', alignItems: 'center', height: 72, gap: 24, zIndex: 2 },
  navLinks: { flexDirection: 'row', gap: 4, marginLeft: 24 },
  navLink: { paddingHorizontal: 12, height: 36, justifyContent: 'center', borderRadius: Radius.md },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 'auto' },
  heroBody: { flex: 1, gap: 48, paddingTop: 48, zIndex: 1 },
  heroBodyDesktop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 32 },
  heroText: { gap: 20 },
  ctaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  heroNote: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  section: { paddingTop: 96, gap: 40 },
  sectionHead: { gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  step: { flexGrow: 1, gap: 10 },
  domainGrid: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1 },
  domainCell: { padding: 24, paddingLeft: 0, paddingRight: 32, gap: 10, borderBottomWidth: 1 },
  split: { flexDirection: 'row', gap: 64 },
  agentRow: { flexDirection: 'row', gap: 24, paddingVertical: 16 },
  rule: { flexDirection: 'row', gap: 16, alignItems: 'baseline' },
  cta: { borderWidth: 1, borderRadius: Radius.xl, padding: 32, gap: 24 },
  ctaDesktop: { flexDirection: 'row', alignItems: 'center', padding: 48, gap: 48 },
  footer: { paddingTop: 96, paddingBottom: 48, gap: 32 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24 },
});
