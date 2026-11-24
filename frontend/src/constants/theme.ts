/**
 * Abhimanyu design tokens (docs/UI_UX_GUIDELINES.md section 2).
 * The product is dark-first ("forensic workstation"); a light palette exists for later.
 * Every severity color must be paired with a text label or icon, never color alone.
 */

import '@/global.css';

import { Platform } from 'react-native';

const dark = {
  background: '#0B1015',
  backgroundElement: '#121A22', // surface-1: cards, panels
  backgroundSelected: '#18232D', // surface-2: elevated, selected
  surfaceHover: '#202D38', // surface-3
  border: '#2B3945',
  text: '#E8EEF3',
  textSecondary: '#A6B4C0',
  textMuted: '#788895',
  accent: '#42D6A4',
  accentHover: '#2DBB8A',
  onAccent: '#06231A',
  info: '#62B5F7',
  warning: '#F4C56A',
  highRisk: '#F08A72',
  critical: '#E35D6A',
  success: '#55C98A',
};

const light: typeof dark = {
  background: '#F5F7F9',
  backgroundElement: '#FFFFFF',
  backgroundSelected: '#E8EEF3',
  surfaceHover: '#DDE5EC',
  border: '#CBD5DD',
  text: '#0B1015',
  textSecondary: '#40505D',
  textMuted: '#5E6E7B',
  accent: '#0E8F68',
  accentHover: '#0B7656',
  onAccent: '#FFFFFF',
  info: '#1F6FB5',
  warning: '#8A5A00',
  highRisk: '#B4472D',
  critical: '#B3202F',
  success: '#1D7A4A',
};

export const Colors = { dark, light } as const;

export type ThemeColor = keyof typeof dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = { sm: 6, md: 10, lg: 16 } as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 960;
