import { useEffect, useState, type ComponentType } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import type { ShaderPreset } from './shader-scene';

type SceneProps = { preset?: ShaderPreset; animate?: boolean; pixelDensity?: number; scrim?: 'left' | 'bottom' | 'veil' | 'none' };

/**
 * Web: load three.js + the shader only in the browser, after the page has rendered.
 * Static HTML stays light and readable; the gradient fades in once ready.
 */
export function ShaderBackdrop({ preset = 'hero', scrim = 'none', style }: { preset?: ShaderPreset; scrim?: SceneProps['scrim']; style?: ViewStyle }) {
  const reduceMotion = useReducedMotion();
  const [Scene, setScene] = useState<ComponentType<SceneProps> | null>(null);
  // Only used once the scene has loaded in the browser, so reading window here is safe.
  const [density] = useState(() =>
    typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1 : 1.5),
  );

  useEffect(() => {
    let alive = true;
    import('./shader-scene').then((m) => alive && setScene(() => m.default as ComponentType<SceneProps>));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.base, style]} aria-hidden>
      {Scene && <Scene preset={preset} animate={!reduceMotion} pixelDensity={density} scrim={scrim} />}
    </View>
  );
}

const styles = StyleSheet.create({ base: { backgroundColor: '#0B1015', overflow: 'hidden' } });
