/**
 * Abhimanyu design tokens (docs/UI_UX_GUIDELINES.md section 2).
 *
 * Direction: exact, sober, quietly vigilant. A forensic auditor's desk at night.
 * Quiet ink neutrals carry the chrome; the brand teal is the one accent; richness lives only in
 * the shader backdrop and in real product content (scores, evidence).
 * Every severity color is paired with a text label, never color alone.
 */

import '@/global.css';

import { Easing } from 'react-native-reanimated';
import { Platform } from 'react-native';

const dark = {
  // Ink neutral ramp
  background: '#0B1015',
  backgroundDeep: '#080B10',
  backgroundElement: '#121A22', // card
  backgroundSelected: '#18232D', // raised: inputs, active rows
  surfaceHover: '#202D38',
  border: 'rgba(232, 238, 243, 0.08)', // hairline
  borderStrong: 'rgba(232, 238, 243, 0.16)',
  // Three text roles
  text: '#E8EEF3',
  textSecondary: '#A6B4C0',
  textMuted: '#7C8C99',
  // The one accent
  accent: '#42D6A4',
  accentHover: '#5BE0B3',
  accentPressed: '#2DBB8A',
  onAccent: '#05241A',
  // Semantic, toned to the ramp
  info: '#62B5F7',
  warning: '#F4C56A',
  highRisk: '#F08A72',
  critical: '#E35D6A',
  success: '#55C98A',
};

const light: typeof dark = {
  background: '#F5F7FA',
  backgroundDeep: '#ECEFF4',
  backgroundElement: '#FFFFFF',
  backgroundSelected: '#ECEFF4',
  surfaceHover: '#E2E7EE',
  border: 'rgba(17, 24, 39, 0.08)',
  borderStrong: 'rgba(17, 24, 39, 0.16)',
  text: '#111827',
  textSecondary: '#4B5565',
  textMuted: '#6B7487',
  accent: '#0E8F68',
  accentHover: '#0B7A59',
  accentPressed: '#09664A',
  onAccent: '#FFFFFF',
  info: '#1F6FB5',
  warning: '#8A5A00',
  highRisk: '#B4472D',
  critical: '#B3202F',
  success: '#1D7A4A',
};

export const Colors = { dark, light } as const;
export type ThemeColor = keyof typeof dark;

/** IBM Plex: technical and calm. Each weight is its own family on native. */
export const FontFamily = Platform.select({
  web: {
    sans: 'IBMPlexSans_400Regular, "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
    sansMedium: 'IBMPlexSans_500Medium, "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
    sansSemiBold: 'IBMPlexSans_600SemiBold, "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: 'IBMPlexMono_400Regular, "IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace',
    monoMedium: 'IBMPlexMono_500Medium, "IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace',
  },
  default: {
    sans: 'IBMPlexSans_400Regular',
    sansMedium: 'IBMPlexSans_500Medium',
    sansSemiBold: 'IBMPlexSans_600SemiBold',
    mono: 'IBMPlexMono_400Regular',
    monoMedium: 'IBMPlexMono_500Medium',
  },
});

/** Kept for older components. */
export const Fonts = { sans: FontFamily.sans, mono: FontFamily.mono, serif: FontFamily.sans, rounded: FontFamily.sans };

/** 4px grid. */
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64, 20: 80, 24: 96, 32: 128 } as const;

export const Radius = { xs: 4, sm: 6, md: 10, lg: 16, xl: 20, pill: 999 } as const;

/** Type scale (size / line height). */
export const Type = {
  display: { fontSize: 56, lineHeight: 60, letterSpacing: -1.6 },
  displayMobile: { fontSize: 40, lineHeight: 44, letterSpacing: -0.8 },
  title: { fontSize: 32, lineHeight: 38, letterSpacing: -0.4 },
  heading: { fontSize: 22, lineHeight: 28, letterSpacing: -0.2 },
  subhead: { fontSize: 18, lineHeight: 28, letterSpacing: 0 },
  body: { fontSize: 15, lineHeight: 22, letterSpacing: 0 },
  small: { fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  caption: { fontSize: 13, lineHeight: 18, letterSpacing: 0 },
  meta: { fontSize: 12, lineHeight: 16, letterSpacing: 0.1 },
  figure: { fontSize: 32, lineHeight: 34, letterSpacing: -0.4 },
} as const;

/** One easing curve and a few durations for every animation. */
export const Motion = {
  easing: Easing.bezier(0.22, 1, 0.36, 1),
  fast: 150,
  menu: 200,
  enter: 380,
  stagger: 50,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 1200;

export const Breakpoints = { tablet: 768, desktop: 1024, wide: 1280 } as const;
