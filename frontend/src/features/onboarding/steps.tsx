import { X } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { CheckRow, Chip, ChoiceCard, Segmented } from '@/components/ui/choice';
import { Divider, EvidenceTag, Notice } from '@/components/ui/misc';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { AuthMode, AuthUser } from '@/lib/auth/types';
import {
  DIGESTS,
  DOMAINS,
  EXPERIENCE,
  GOALS,
  HORIZONS,
  labelOf,
  LANGUAGES,
  MARKET_CAPS,
  PORTFOLIO_SOURCES,
  QUIET_HOURS,
  RISK,
  ROLES,
  SECTORS,
  SEVERITIES,
  STYLE_SAMPLES,
  WATCHLIST_SUGGESTIONS,
} from '@/lib/profile/options';
import type { Channel, Exchange, ExplanationStyle, UserProfile } from '@/lib/profile/types';

export type StepProps = {
  p: UserProfile;
  set: (fn: (p: UserProfile) => UserProfile) => void;
  user: AuthUser | null;
  mode: AuthMode;
  actions: { resendVerification(): Promise<void>; reloadUser(): Promise<void> };
};

export type StepDef = {
  id: string;
  nav: string;
  title: string;
  subtitle: string;
  optional?: boolean;
  validate?: (p: UserProfile) => string | null;
  Body: (props: StepProps) => ReactNode;
};

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <View style={{ gap: 4 }}>
        <Text variant="small" weight="medium" tone="textSecondary">
          {label}
        </Text>
        {hint ? (
          <Text variant="caption" tone="textMuted">
            {hint}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const Wrap = ({ children }: { children: ReactNode }) => <View style={styles.wrap}>{children}</View>;
const Stack = ({ children, gap = 12 }: { children: ReactNode; gap?: number }) => <View style={{ gap }}>{children}</View>;

// ─── Steps ───────────────────────────────────────────────────────────────────

function Welcome({ user, mode, actions }: StepProps) {
  const t = useTheme();
  const [sent, setSent] = useState(false);
  const items = [
    ['Who you are and how you invest', 'So findings are explained at the right depth'],
    ['Sectors and companies to watch', 'So your first reports are about companies you care about'],
    ['Red flags and how to reach you', 'So alerts are useful, not noisy'],
    ['Consent for how your data is used', 'You stay in control; optional items are off by default'],
  ];
  return (
    <Stack gap={24}>
      <View style={[styles.panel, { backgroundColor: t.backgroundElement, borderColor: t.border }]}>
        {items.map(([a, b], i) => (
          <View key={a}>
            {i > 0 && <Divider style={{ marginVertical: 12 }} />}
            <View style={styles.listRow}>
              <Text variant="meta" mono tone="textMuted" style={{ width: 24 }}>
                {String(i + 1).padStart(2, '0')}
              </Text>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="body" weight="medium">
                  {a}
                </Text>
                <Text variant="caption" tone="textSecondary">
                  {b}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
      {mode === 'firebase' && user && !user.emailVerified && (
        <Notice>
          <Stack gap={10}>
            <Text variant="caption" tone="textSecondary">
              We sent a verification link to {user.email}. You can carry on and verify later.
            </Text>
            <View style={styles.row}>
              <Button
                size="sm"
                variant="secondary"
                label={sent ? 'Sent again' : 'Resend email'}
                disabled={sent}
                onPress={async () => {
                  await actions.resendVerification().catch(() => undefined);
                  setSent(true);
                }}
              />
              <Button size="sm" variant="ghost" label="I have verified it" onPress={() => actions.reloadUser()} />
            </View>
          </Stack>
        </Notice>
      )}
    </Stack>
  );
}

function AboutYou({ p, set }: StepProps) {
  const pro = ROLES.find((r) => r.value === p.role)?.pro;
  return (
    <Stack gap={24}>
      <TextField
        label="Your name"
        value={p.displayName}
        onChangeText={(v) => set((x) => ({ ...x, displayName: v }))}
        autoComplete="name"
        autoCapitalize="words"
        hint="Shown on your reports and to teammates if you share them"
      />
      <Field label="Which describes you best?">
        <View style={styles.cards}>
          {ROLES.map((r) => (
            <ChoiceCard
              key={r.value}
              title={r.title}
              description={r.description}
              selected={p.role === r.value}
              onPress={() => set((x) => ({ ...x, role: r.value }))}
              style={styles.cardHalf}
            />
          ))}
        </View>
      </Field>
      {pro && (
        <TextField
          label="Organisation"
          optional
          value={p.organisation}
          onChangeText={(v) => set((x) => ({ ...x, organisation: v }))}
          autoComplete="organization"
          hint="Helps us plan team workspaces and shared reports"
        />
      )}
    </Stack>
  );
}

function ExperienceStep({ p, set }: StepProps) {
  const t = useTheme();
  const sample = STYLE_SAMPLES[p.explanationStyle];
  return (
    <Stack gap={24}>
      <Field label="How long have you been investing?">
        <View style={styles.cards}>
          {EXPERIENCE.map((e) => (
            <ChoiceCard
              key={e.value}
              title={e.title}
              description={e.description}
              selected={p.experience === e.value}
              onPress={() => set((x) => ({ ...x, experience: e.value, explanationStyle: e.style }))}
              style={styles.cardHalf}
            />
          ))}
        </View>
      </Field>
      <Field label="How should findings be explained?" hint="The same red flag, three ways. You can switch any time.">
        <Segmented<ExplanationStyle>
          options={(['plain', 'balanced', 'technical'] as const).map((v) => ({ value: v, label: STYLE_SAMPLES[v].label }))}
          value={p.explanationStyle}
          onChange={(v) => set((x) => ({ ...x, explanationStyle: v }))}
        />
        <View style={[styles.panel, { backgroundColor: t.backgroundElement, borderColor: t.border, gap: 12 }]}>
          <View style={styles.rowBetween}>
            <Text variant="caption" weight="medium" tone="textSecondary">
              Accounting quality · Elevated
            </Text>
            <EvidenceTag>AR FY25 · p.142</EvidenceTag>
          </View>
          <Text variant="body">{sample.text}</Text>
        </View>
      </Field>
    </Stack>
  );
}

function Goals({ p, set }: StepProps) {
  return (
    <Stack gap={24}>
      <Field label="What brings you here?" hint="Pick any that apply">
        <View style={styles.wrapCol}>
          {GOALS.map((g) => (
            <ChoiceCard key={g.value} multi title={g.label} selected={p.goals.includes(g.value)} onPress={() => set((x) => ({ ...x, goals: toggle(x.goals, g.value) }))} />
          ))}
        </View>
      </Field>
      <Field label="Exchanges">
        <Wrap>
          {(['NSE', 'BSE'] as Exchange[]).map((ex) => (
            <Chip key={ex} label={ex} selected={p.exchanges.includes(ex)} onPress={() => set((x) => ({ ...x, exchanges: toggle(x.exchanges, ex) }))} />
          ))}
        </Wrap>
      </Field>
      <Field label="Usual holding period" hint="Optional">
        <Wrap>
          {HORIZONS.map((h) => (
            <Chip key={h.value} label={h.label} selected={p.horizon === h.value} onPress={() => set((x) => ({ ...x, horizon: x.horizon === h.value ? null : h.value }))} />
          ))}
        </Wrap>
      </Field>
      <Field label="Risk appetite" hint="Optional. Decides how prominently borderline indicators are shown to you.">
        <Wrap>
          {RISK.map((r) => (
            <Chip
              key={r.value}
              label={r.label}
              selected={p.riskTolerance === r.value}
              onPress={() => set((x) => ({ ...x, riskTolerance: x.riskTolerance === r.value ? null : r.value }))}
            />
          ))}
        </Wrap>
      </Field>
    </Stack>
  );
}

function Interests({ p, set }: StepProps) {
  return (
    <Stack gap={24}>
      <Field label="Sectors">
        <Wrap>
          {SECTORS.map((s) => (
            <Chip key={s} label={s} selected={p.sectors.includes(s)} onPress={() => set((x) => ({ ...x, sectors: toggle(x.sectors, s) }))} />
          ))}
        </Wrap>
      </Field>
      <Field label="Company size" hint="Smaller companies get more scrutiny for pump-and-dump patterns">
        <Wrap>
          {MARKET_CAPS.map((m) => (
            <Chip key={m} label={m} selected={p.marketCaps.includes(m)} onPress={() => set((x) => ({ ...x, marketCaps: toggle(x.marketCaps, m) }))} />
          ))}
        </Wrap>
      </Field>
    </Stack>
  );
}

const SYMBOL = /^([A-Z][A-Z0-9&-]{1,19}|\d{6})$/;

function Watchlist({ p, set }: StepProps) {
  const t = useTheme();
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const add = (raw: string) => {
    const s = raw.trim().toUpperCase().replace(/^(NSE|BSE):/, '');
    if (!s) return;
    if (!SYMBOL.test(s)) return setError('Use an NSE symbol like INFY or a 6-digit BSE code like 500209');
    if (p.watchlist.includes(s)) return setError(`${s} is already on your list`);
    if (p.watchlist.length >= 25) return setError('You can add up to 25 companies here, and more later');
    set((x) => ({ ...x, watchlist: [...x.watchlist, s] }));
    setInput('');
    setError(null);
  };
  return (
    <Stack gap={24}>
      <View style={{ gap: 12 }}>
        <View style={styles.addRow}>
          <View style={{ flex: 1 }}>
            <TextField
              label="NSE symbol or BSE code"
              value={input}
              onChangeText={(v) => {
                setInput(v);
                setError(null);
              }}
              error={error}
              placeholder="e.g. INFY or 500209"
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => add(input)}
            />
          </View>
          <View style={{ paddingTop: 28 }}>
            <Button label="Add" variant="secondary" onPress={() => add(input)} />
          </View>
        </View>
        {p.watchlist.length > 0 ? (
          <Wrap>
            {p.watchlist.map((s) => (
              <Chip
                key={s}
                label={s}
                selected
                onPress={() => set((x) => ({ ...x, watchlist: x.watchlist.filter((w) => w !== s) }))}
                accessory={<X size={14} strokeWidth={1.5} color={t.textSecondary} />}
              />
            ))}
          </Wrap>
        ) : (
          <Text variant="caption" tone="textMuted">
            Nothing added yet. Popular picks:
          </Text>
        )}
        <Wrap>
          {WATCHLIST_SUGGESTIONS.filter((s) => !p.watchlist.includes(s)).map((s) => (
            <Chip key={s} label={s} selected={false} onPress={() => add(s)} />
          ))}
        </Wrap>
      </View>
      <Field label="Your holdings" hint="Linking holdings lets us alert you only about what you own">
        <View style={styles.cards}>
          {PORTFOLIO_SOURCES.map((s) => (
            <ChoiceCard
              key={s.value}
              title={s.title}
              description={s.description}
              selected={p.portfolioSource === s.value}
              onPress={() => set((x) => ({ ...x, portfolioSource: s.value }))}
              style={styles.cardHalf}
            />
          ))}
        </View>
      </Field>
    </Stack>
  );
}

function Focus({ p, set }: StepProps) {
  return (
    <Stack gap={24}>
      <Field label="Watch for" hint="All six are on by default">
        <View style={styles.cards}>
          {DOMAINS.map((d) => (
            <ChoiceCard
              key={d.value}
              multi
              title={d.title}
              description={d.description}
              selected={p.focusDomains.includes(d.value)}
              onPress={() => set((x) => ({ ...x, focusDomains: toggle(x.focusDomains, d.value) }))}
              meta={<EvidenceTag>{d.source}</EvidenceTag>}
              style={styles.cardHalf}
            />
          ))}
        </View>
      </Field>
      <Field label="Alert me about" hint={SEVERITIES.find((s) => s.value === p.notificationPrefs.min_severity)?.hint}>
        <Wrap>
          {SEVERITIES.map((s) => (
            <Chip
              key={s.value}
              label={s.label}
              selected={p.notificationPrefs.min_severity === s.value}
              onPress={() => set((x) => ({ ...x, notificationPrefs: { ...x.notificationPrefs, min_severity: s.value } }))}
            />
          ))}
        </Wrap>
      </Field>
    </Stack>
  );
}

const CHANNELS: { value: Channel; title: string; description: string }[] = [
  { value: 'in_app', title: 'In the app', description: 'Always on, so nothing is ever lost' },
  { value: 'push', title: 'Push notifications', description: 'On your phone, through the Abhimanyu app' },
  { value: 'email', title: 'Email', description: 'Alerts and digests to your inbox' },
  { value: 'whatsapp', title: 'WhatsApp', description: 'For high-priority alerts. We will confirm before sending' },
];

function Alerts({ p, set }: StepProps) {
  const prefs = p.notificationPrefs;
  const setPrefs = (patch: Partial<UserProfile['notificationPrefs']>) => set((x) => ({ ...x, notificationPrefs: { ...x.notificationPrefs, ...patch } }));
  const quiet = prefs.quiet_hours.enabled ? `${prefs.quiet_hours.start}-${prefs.quiet_hours.end}` : 'off';
  return (
    <Stack gap={24}>
      <Field label="Channels">
        <View style={styles.cards}>
          {CHANNELS.map((ch) => (
            <ChoiceCard
              key={ch.value}
              multi
              title={ch.title}
              description={ch.description}
              selected={prefs.channels.includes(ch.value)}
              onPress={() => ch.value !== 'in_app' && setPrefs({ channels: toggle(prefs.channels, ch.value) })}
              style={styles.cardHalf}
            />
          ))}
        </View>
      </Field>
      {prefs.channels.includes('whatsapp') && (
        <TextField
          label="WhatsApp number"
          value={prefs.whatsapp_number}
          onChangeText={(v) => setPrefs({ whatsapp_number: v.replace(/[^\d+ ]/g, '') })}
          placeholder="+91 98765 43210"
          keyboardType="phone-pad"
          autoComplete="tel"
          hint="Indian mobile number. Used only for alerts you choose."
        />
      )}
      <Field label="How often">
        <Wrap>
          {DIGESTS.map((d) => (
            <Chip key={d.value} label={d.label} selected={prefs.digest === d.value} onPress={() => setPrefs({ digest: d.value })} />
          ))}
        </Wrap>
      </Field>
      <Field label="Quiet hours" hint={`Times are in ${prefs.quiet_hours.timezone}. Critical alerts wait until morning.`}>
        <Wrap>
          {QUIET_HOURS.map((q) => (
            <Chip
              key={q.value}
              label={q.label}
              selected={quiet === q.value}
              onPress={() => {
                if (q.value === 'off') return setPrefs({ quiet_hours: { ...prefs.quiet_hours, enabled: false } });
                const [start, end] = q.value.split('-');
                setPrefs({ quiet_hours: { ...prefs.quiet_hours, enabled: true, start, end } });
              }}
            />
          ))}
        </Wrap>
      </Field>
      <Field label="Report language" hint="Reports are in English today. We will switch when your language is ready.">
        <Wrap>
          {LANGUAGES.map((l) => (
            <Chip key={l.value} label={l.label} selected={p.locale.reportLanguage === l.value} onPress={() => set((x) => ({ ...x, locale: { ...x.locale, reportLanguage: l.value } }))} />
          ))}
        </Wrap>
      </Field>
      <Field label="Number format">
        <Segmented
          options={[
            { value: 'indian', label: '₹12,50,000 (lakh, crore)' },
            { value: 'international', label: '₹1,250,000 (million)' },
          ]}
          value={p.locale.numberFormat}
          onChange={(v) => set((x) => ({ ...x, locale: { ...x.locale, numberFormat: v } }))}
        />
      </Field>
    </Stack>
  );
}

function Consent({ p, set }: StepProps) {
  const c = p.consents;
  const now = () => new Date().toISOString();
  const setC = (patch: Partial<UserProfile['consents']>) => set((x) => ({ ...x, consents: { ...x.consents, ...patch } }));
  return (
    <Stack gap={24}>
      <Field label="Required">
        <Stack gap={12}>
          <CheckRow checked={!!c.disclaimerAcceptedAt} onToggle={() => setC({ disclaimerAcceptedAt: c.disclaimerAcceptedAt ? null : now() })}>
            <Text variant="small">
              I understand that Abhimanyu shows risk indicators for review. They are not proof of fraud and not investment advice.
            </Text>
          </CheckRow>
          <CheckRow checked={!!c.ageConfirmedAt} onToggle={() => setC({ ageConfirmedAt: c.ageConfirmedAt ? null : now() })}>
            <Text variant="small">I am 18 or older</Text>
          </CheckRow>
        </Stack>
      </Field>
      <Field label="Optional" hint="Off unless you turn them on">
        <Stack gap={12}>
          <CheckRow checked={c.improveModels} onToggle={() => setC({ improveModels: !c.improveModels })}>
            <Text variant="small">Use my anonymised feedback on flags (confirm or dismiss) to improve detection</Text>
          </CheckRow>
          <CheckRow checked={c.productEmails} onToggle={() => setC({ productEmails: !c.productEmails })}>
            <Text variant="small">Email me about new features and research</Text>
          </CheckRow>
        </Stack>
      </Field>
      <Notice>
        Under India&apos;s Digital Personal Data Protection Act, 2023, you can withdraw consent, download your data or ask for it to be deleted at any
        time. We collect only what the service needs, and never sell your data.
      </Notice>
    </Stack>
  );
}

function Review({ p, mode }: StepProps) {
  const t = useTheme();
  const rows: [string, string][] = [
    ['Name', p.displayName || 'Not set'],
    ['Role', labelOf(ROLES, p.role) ?? 'Not set'],
    ['Explanations', STYLE_SAMPLES[p.explanationStyle].label],
    ['Exchanges', p.exchanges.join(', ') || 'None'],
    ['Sectors', p.sectors.length ? `${p.sectors.length} selected` : 'All sectors'],
    ['Watchlist', p.watchlist.length ? p.watchlist.slice(0, 6).join(', ') + (p.watchlist.length > 6 ? ` +${p.watchlist.length - 6}` : '') : 'Empty for now'],
    ['Red flags', `${p.focusDomains.length} of 6 domains`],
    ['Alerts', `${labelOf(SEVERITIES, p.notificationPrefs.min_severity)} · ${labelOf(DIGESTS, p.notificationPrefs.digest)}`],
    ['Channels', p.notificationPrefs.channels.map((c) => CHANNELS.find((x) => x.value === c)?.title).join(', ')],
  ];
  return (
    <View style={[styles.panel, { backgroundColor: t.backgroundElement, borderColor: t.border }]}>
      {rows.map(([k, v], i) => (
        <View key={k}>
          {i > 0 && <Divider style={{ marginVertical: 10 }} />}
          <View style={styles.reviewRow}>
            <Text variant="caption" tone="textMuted" style={{ width: 112 }}>
              {k}
            </Text>
            <Text variant="small" style={{ flex: 1 }}>
              {v}
            </Text>
          </View>
        </View>
      ))}
      {mode === 'demo' && (
        <Notice>
          <Text variant="caption" tone="textSecondary">
            Demo mode: accounts and profiles are saved only on this device. Connect Firebase to enable cloud accounts and profile sync.
          </Text>
        </Notice>
      )}
    </View>
  );
}

export const STEPS: StepDef[] = [
  { id: 'welcome', nav: 'Welcome', title: 'Set up your investigation desk', subtitle: 'A few questions so findings come at the right depth and alerts stay useful. About two minutes, and every answer can be changed later.', Body: Welcome },
  {
    id: 'you',
    nav: 'About you',
    title: 'About you',
    subtitle: 'Tells us which tools and level of detail to put first',
    validate: (p) => (p.displayName.trim().length < 2 ? 'Enter your name' : !p.role ? 'Choose the option closest to you' : null),
    Body: AboutYou,
  },
  {
    id: 'experience',
    nav: 'Experience',
    title: 'How you invest',
    subtitle: 'We adjust the language of every report to your experience',
    validate: (p) => (!p.experience ? 'Choose how long you have been investing' : null),
    Body: ExperienceStep,
  },
  {
    id: 'goals',
    nav: 'Goals',
    title: 'What you want from Abhimanyu',
    subtitle: 'Shapes what your home screen shows first',
    validate: (p) => (p.exchanges.length === 0 ? 'Pick at least one exchange' : null),
    Body: Goals,
  },
  { id: 'interests', nav: 'Interests', title: 'Sectors you follow', subtitle: 'Used to suggest companies and to rank new filings for you', optional: true, Body: Interests },
  { id: 'watchlist', nav: 'Watchlist', title: 'Companies to watch', subtitle: 'We will start monitoring these as soon as your account is ready', optional: true, Body: Watchlist },
  {
    id: 'focus',
    nav: 'Red flags',
    title: 'Red flags you care about',
    subtitle: 'Every domain is still analysed; this decides what reaches you',
    validate: (p) => (p.focusDomains.length === 0 ? 'Keep at least one red-flag domain' : null),
    Body: Focus,
  },
  {
    id: 'alerts',
    nav: 'Alerts',
    title: 'How we reach you',
    subtitle: 'Choose channels and timing. Nothing is sent without your choice here.',
    validate: (p) => {
      const n = p.notificationPrefs;
      if (!n.channels.includes('whatsapp')) return null;
      const digits = n.whatsapp_number.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
      return /^[6-9]\d{9}$/.test(digits) ? null : 'Enter a valid 10-digit Indian mobile number, or turn WhatsApp off';
    },
    Body: Alerts,
  },
  {
    id: 'consent',
    nav: 'Consent',
    title: 'Your data and consent',
    subtitle: 'Two confirmations are required to use the service',
    validate: (p) => (!p.consents.disclaimerAcceptedAt || !p.consents.ageConfirmedAt ? 'Please confirm both required items' : null),
    Body: Consent,
  },
  { id: 'review', nav: 'Review', title: 'Your desk is ready', subtitle: 'Here is what we set up. You can change any of it later in Settings.', Body: Review },
];

const styles = StyleSheet.create({
  field: { gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wrapCol: { gap: 8 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cardHalf: { flexGrow: 1, flexBasis: 260 },
  panel: { borderWidth: 1, borderRadius: Radius.lg, padding: 20 },
  listRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  reviewRow: { flexDirection: 'row', gap: 12 },
});
