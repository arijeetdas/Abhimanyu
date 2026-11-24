/**
 * What onboarding collects. Field names follow docs/DATA_SCHEMA.md (users, watchlists,
 * portfolio_holdings, alerts) and docs/API_SPECIFICATION.md (PATCH /auth/me notification_prefs),
 * so the backend can store this object as-is when the API exists.
 */

export const PROFILE_VERSION = 1;
export const CONSENT_VERSION = '2026-11';

export type Role = 'retail_investor' | 'analyst' | 'advisor' | 'compliance' | 'journalist' | 'student';
export type Experience = 'new' | 'some' | 'experienced' | 'professional';
export type ExplanationStyle = 'plain' | 'balanced' | 'technical';
export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';
export type Horizon = 'short' | 'medium' | 'long';
export type Exchange = 'NSE' | 'BSE';
export type Goal = 'vet_before_buy' | 'monitor_holdings' | 'research' | 'governance' | 'learn';
export type PortfolioSource = 'later' | 'manual' | 'csv' | 'broker_import';
export type DomainId = 'related_party' | 'promoter_pledge' | 'sentiment_reality' | 'order_book' | 'accounting_quality' | 'auditor_signals';
export type Channel = 'in_app' | 'push' | 'email' | 'whatsapp';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Digest = 'instant' | 'daily' | 'weekly';
export type NumberFormat = 'indian' | 'international';

export type UserProfile = {
  version: number;
  displayName: string;
  /** Detailed persona; maps to users.role = 'investor' | 'analyst' on the backend. */
  role: Role | null;
  organisation: string;
  experience: Experience | null;
  explanationStyle: ExplanationStyle;
  /** users.risk_tolerance */
  riskTolerance: RiskTolerance | null;
  horizon: Horizon | null;
  goals: Goal[];
  exchanges: Exchange[];
  sectors: string[];
  marketCaps: string[];
  /** watchlist_items.company_ref (NSE symbol or BSE code) */
  watchlist: string[];
  /** portfolio_holdings.source the user intends to use */
  portfolioSource: PortfolioSource;
  focusDomains: DomainId[];
  /** users.notification_prefs (PATCH /auth/me) */
  notificationPrefs: {
    channels: Channel[];
    min_severity: Severity;
    digest: Digest;
    quiet_hours: { enabled: boolean; start: string; end: string; timezone: string };
    whatsapp_number: string;
  };
  locale: { reportLanguage: string; numberFormat: NumberFormat };
  consents: {
    version: string;
    termsAcceptedAt: string | null;
    disclaimerAcceptedAt: string | null;
    ageConfirmedAt: string | null;
    improveModels: boolean;
    productEmails: boolean;
  };
  onboarding: { startedAt: string; lastStep: number; completedAt: string | null };
  updatedAt: string;
};

const detectTimezone = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    return tz === 'Asia/Calcutta' ? 'Asia/Kolkata' : tz; // browsers still report the legacy name
  } catch {
    return 'Asia/Kolkata';
  }
};

export function emptyProfile(displayName = ''): UserProfile {
  const now = new Date().toISOString();
  return {
    version: PROFILE_VERSION,
    displayName,
    role: null,
    organisation: '',
    experience: null,
    explanationStyle: 'balanced',
    riskTolerance: null,
    horizon: null,
    goals: [],
    exchanges: ['NSE', 'BSE'],
    sectors: [],
    marketCaps: [],
    watchlist: [],
    portfolioSource: 'later',
    focusDomains: ['related_party', 'promoter_pledge', 'sentiment_reality', 'order_book', 'accounting_quality', 'auditor_signals'],
    notificationPrefs: {
      channels: ['in_app', 'push'],
      min_severity: 'high',
      digest: 'daily',
      quiet_hours: { enabled: true, start: '22:00', end: '07:00', timezone: detectTimezone() },
      whatsapp_number: '',
    },
    locale: { reportLanguage: 'en', numberFormat: 'indian' },
    consents: {
      version: CONSENT_VERSION,
      termsAcceptedAt: null,
      disclaimerAcceptedAt: null,
      ageConfirmedAt: null,
      improveModels: false,
      productEmails: false,
    },
    onboarding: { startedAt: now, lastStep: 0, completedAt: null },
    updatedAt: now,
  };
}

/** Fill fields added in later versions so old saved profiles keep working. */
export function normalizeProfile(raw: Partial<UserProfile> | null | undefined, fallbackName = ''): UserProfile {
  const base = emptyProfile(fallbackName);
  if (!raw) return base;
  return {
    ...base,
    ...raw,
    notificationPrefs: { ...base.notificationPrefs, ...raw.notificationPrefs, quiet_hours: { ...base.notificationPrefs.quiet_hours, ...raw.notificationPrefs?.quiet_hours } },
    locale: { ...base.locale, ...raw.locale },
    consents: { ...base.consents, ...raw.consents },
    onboarding: { ...base.onboarding, ...raw.onboarding },
    version: PROFILE_VERSION,
  };
}
