import type { Metadata } from 'expo-router/server';

/**
 * "/" resolves per platform through Metro:
 *   website   -> src/features/entry/entry.web.tsx  (landing page)
 *   app       -> src/features/entry/entry.tsx      (straight to sign-in / onboarding / home)
 * Keeping the split outside src/app guarantees the landing page is never shipped in the app.
 */
export { default } from '@/features/entry/entry';

export function generateMetadata(): Metadata {
  return {
    title: 'Abhimanyu: forensic red flags for NSE and BSE companies',
    description:
      'Abhimanyu reads annual reports, auditor notes and exchange disclosures, maps promoter and director links, and gives every Indian listed company an explainable Red Flag Score.',
  };
}
