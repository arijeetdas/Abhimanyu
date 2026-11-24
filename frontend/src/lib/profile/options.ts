import type { Digest, DomainId, Experience, ExplanationStyle, Goal, Horizon, PortfolioSource, RiskTolerance, Role, Severity } from './types';

export const ROLES: { value: Role; title: string; description: string; pro: boolean }[] = [
  { value: 'retail_investor', title: 'Individual investor', description: 'I invest my own money', pro: false },
  { value: 'analyst', title: 'Research analyst', description: 'I research companies professionally', pro: true },
  { value: 'advisor', title: 'Financial advisor', description: 'I advise clients on investments', pro: true },
  { value: 'compliance', title: 'Compliance or audit', description: 'I review governance and disclosures', pro: true },
  { value: 'journalist', title: 'Journalist', description: 'I investigate companies for stories', pro: true },
  { value: 'student', title: 'Student or learner', description: 'I am learning how markets work', pro: false },
];

export const EXPERIENCE: { value: Experience; title: string; description: string; style: ExplanationStyle }[] = [
  { value: 'new', title: 'Just starting', description: 'Under a year of investing', style: 'plain' },
  { value: 'some', title: 'A few years', description: 'I know P/E ratios and quarterly results', style: 'balanced' },
  { value: 'experienced', title: 'Experienced', description: 'I read annual reports and cash flow statements', style: 'technical' },
  { value: 'professional', title: 'Professional', description: 'Finance, audit or research is my job', style: 'technical' },
];

/** The same finding explained three ways: shown live in onboarding. */
export const STYLE_SAMPLES: Record<ExplanationStyle, { label: string; text: string }> = {
  plain: {
    label: 'Plain language',
    text: 'Customers owe the company far more money than a year ago, but sales barely grew. Profits on paper may not be turning into cash.',
  },
  balanced: {
    label: 'Balanced',
    text: 'Trade receivables rose 41% while revenue grew 9%. Reported profit is running ahead of the cash the business collects.',
  },
  technical: {
    label: 'Technical',
    text: 'Receivables +41% YoY vs revenue +9%; DSO up from 62 to 89 days. Beneish DSRI of 1.29 adds to the M-Score.',
  },
};

export const GOALS: { value: Goal; label: string }[] = [
  { value: 'vet_before_buy', label: 'Check a company before I buy' },
  { value: 'monitor_holdings', label: 'Watch companies I already hold' },
  { value: 'research', label: 'Research and compare companies' },
  { value: 'governance', label: 'Track promoters and governance' },
  { value: 'learn', label: 'Learn to read financial filings' },
];

export const HORIZONS: { value: Horizon; label: string }[] = [
  { value: 'short', label: 'Under 1 year' },
  { value: 'medium', label: '1 to 3 years' },
  { value: 'long', label: 'Over 3 years' },
];

export const RISK: { value: RiskTolerance; label: string }[] = [
  { value: 'conservative', label: 'Conservative' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'aggressive', label: 'Aggressive' },
];

export const SECTORS = [
  'Banking and finance',
  'IT services',
  'Pharma and healthcare',
  'FMCG',
  'Auto and ancillaries',
  'Energy and power',
  'Metals and mining',
  'Infrastructure',
  'Real estate',
  'Chemicals',
  'Textiles',
  'Telecom and media',
  'Capital goods',
  'Public sector (PSU)',
];

export const MARKET_CAPS = ['Large cap', 'Mid cap', 'Small cap', 'Micro cap'];

export const WATCHLIST_SUGGESTIONS = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'ITC', 'LT', 'SBIN'];

export const PORTFOLIO_SOURCES: { value: PortfolioSource; title: string; description: string }[] = [
  { value: 'later', title: 'Not now', description: 'Use the watchlist for the time being' },
  { value: 'manual', title: 'Add holdings by hand', description: 'Type in the stocks and quantities you own' },
  { value: 'csv', title: 'Upload a broker statement', description: 'A CSV holdings export from your broker' },
  { value: 'broker_import', title: 'Connect my broker', description: 'We will ask for permission when this becomes available' },
];

/** From README "Detection Domains". */
export const DOMAINS: { value: DomainId; title: string; description: string; source: string }[] = [
  { value: 'related_party', title: 'Related party transactions', description: 'Circular money loops between linked companies, large loans to promoter-linked entities', source: 'AOC-2 · MCA-21' },
  { value: 'promoter_pledge', title: 'Promoter pledge anomalies', description: 'Sudden rises in pledged shares, hidden promoter-group entities', source: 'SHP · SAST' },
  { value: 'sentiment_reality', title: 'Sentiment vs reality', description: 'Upbeat management commentary that clashes with auditor notes and cash flows', source: 'MD&A · auditor report' },
  { value: 'order_book', title: 'Order book spoofing', description: 'Abnormal order placement and cancellation, volume spikes before announcements', source: 'exchange data' },
  { value: 'accounting_quality', title: 'Accounting quality', description: 'Receivables growing faster than revenue, profit without cash, restatements', source: 'Beneish M-Score' },
  { value: 'auditor_signals', title: 'Auditor signals', description: 'Mid-term resignations, qualified opinions, going-concern doubts', source: 'BSE · NSE filings' },
];

export const SEVERITIES: { value: Severity; label: string; hint: string }[] = [
  { value: 'low', label: 'Everything', hint: 'Every new indicator, including low-risk ones' },
  { value: 'medium', label: 'Moderate and up', hint: 'Indicators worth monitoring and above' },
  { value: 'high', label: 'Elevated and up', hint: 'Multiple indicators that need a careful review' },
  { value: 'critical', label: 'High only', hint: 'Only strong, corroborated warning indicators' },
];

export const DIGESTS: { value: Digest; label: string }[] = [
  { value: 'instant', label: 'As it happens' },
  { value: 'daily', label: 'Daily digest' },
  { value: 'weekly', label: 'Weekly digest' },
];

export const QUIET_HOURS = [
  { value: '22:00-07:00', label: '10 pm to 7 am' },
  { value: '23:00-06:00', label: '11 pm to 6 am' },
  { value: 'off', label: 'No quiet hours' },
];

/** Reports are in English today; the preference is stored for when other languages ship. */
export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'bn', label: 'বাংলা' },
  { value: 'mr', label: 'मराठी' },
  { value: 'ta', label: 'தமிழ்' },
  { value: 'te', label: 'తెలుగు' },
  { value: 'gu', label: 'ગુજરાતી' },
];

export const labelOf = <T extends string>(list: { value: T; title?: string; label?: string }[], v: T | null | undefined) => {
  const hit = list.find((x) => x.value === v);
  return hit ? (hit.title ?? hit.label ?? v) : null;
};
