import { useSyncExternalStore } from 'react';
import { useWindowDimensions } from 'react-native';

import { Breakpoints } from '@/constants/theme';

const noopSubscribe = () => () => {};

/** False while rendering on the server and during hydration, true afterwards (and always on native). */
export function useMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * Responsive helpers. On web the first render (server and hydration) is always the mobile layout,
 * then it switches after mount, so static HTML and the first client render match exactly.
 */
export function useLayout() {
  const { width, height } = useWindowDimensions();
  const mounted = useMounted();
  const w = mounted ? width : 375;
  return {
    width: w,
    height: mounted ? height : 800,
    isTablet: w >= Breakpoints.tablet,
    isDesktop: w >= Breakpoints.desktop,
    isWide: w >= Breakpoints.wide,
    mounted,
  };
}
