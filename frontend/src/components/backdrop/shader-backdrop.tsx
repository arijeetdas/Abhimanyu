import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import ShaderScene, { type ShaderPreset } from './shader-scene';

/** Android / iOS: the same shader, rendered in Expo's DOM WebView behind native content. */
export function ShaderBackdrop({
  preset = 'calm',
  scrim = 'none',
  style,
}: {
  preset?: ShaderPreset;
  scrim?: 'left' | 'bottom' | 'veil' | 'none';
  style?: ViewStyle;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.base, style]}>
      <ShaderScene
        preset={preset}
        animate={!reduceMotion}
        pixelDensity={1}
        scrim={scrim}
        dom={{
          style: { flex: 1, backgroundColor: '#0B1015' },
          containerStyle: { flex: 1 },
          scrollEnabled: false,
          bounces: false,
          overScrollMode: 'never',
          pointerEvents: 'none',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({ base: { backgroundColor: '#0B1015', overflow: 'hidden' } });
