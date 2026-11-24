'use dom';

/**
 * Animated backdrop built with @shadergradient/react (https://github.com/ruucm/shadergradient).
 * A DOM component: on web it renders inline (loaded lazily by shader-backdrop.web.tsx), in the
 * Android/iOS app it runs inside Expo's DOM WebView (shader-backdrop.tsx).
 */
import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react';
import { Component, type ReactNode } from 'react';

export type ShaderPreset = 'hero' | 'calm';

type Props = {
  preset?: ShaderPreset;
  animate?: boolean;
  pixelDensity?: number;
  /** Ink scrim so text stays readable: from the left (hero) or from the bottom (mobile). */
  scrim?: 'left' | 'bottom' | 'veil' | 'none';
  dom?: import('expo/dom').DOMProps;
};

// Ink and brand teal only. Slow and low contrast: it should feel like light on deep water at night.
const PRESETS = {
  hero: {
    type: 'waterPlane',
    color1: '#0B1015',
    color2: '#1F7A68',
    color3: '#42D6A4',
    uSpeed: 0.12,
    uStrength: 1.6,
    uDensity: 1.3,
    uFrequency: 5.5,
    uAmplitude: 0,
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    rotationX: 50,
    rotationY: 0,
    rotationZ: -60,
    cAzimuthAngle: 180,
    cPolarAngle: 80,
    cDistance: 2.8,
    cameraZoom: 9.1,
    brightness: 1.15,
    reflection: 0.1,
    lightType: '3d',
    envPreset: 'city',
    grain: 'off',
  },
  // Same water surface as the hero, seen from another angle: a little brighter, no text to protect.
  calm: {
    type: 'waterPlane',
    color1: '#0B1015',
    color2: '#1F7A68',
    color3: '#42D6A4',
    uSpeed: 0.1,
    uStrength: 1.8,
    uDensity: 1.2,
    uFrequency: 5.5,
    uAmplitude: 0,
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    rotationX: 50,
    rotationY: 0,
    rotationZ: 30,
    cAzimuthAngle: 180,
    cPolarAngle: 80,
    cDistance: 2.8,
    cameraZoom: 9.1,
    brightness: 1.25,
    reflection: 0.1,
    lightType: '3d',
    envPreset: 'city',
    grain: 'off',
  },
} as const;

const SCRIMS = {
  left: 'linear-gradient(90deg, rgba(11,16,21,0.92) 0%, rgba(11,16,21,0.72) 38%, rgba(11,16,21,0.18) 72%, rgba(11,16,21,0.35) 100%)',
  bottom: 'linear-gradient(180deg, rgba(11,16,21,0.2) 0%, rgba(11,16,21,0.55) 55%, rgba(11,16,21,0.92) 100%)',
  veil: 'linear-gradient(180deg, rgba(11,16,21,0.62) 0%, rgba(11,16,21,0.74) 60%, rgba(11,16,21,0.94) 100%)',
  none: 'none',
} as const;

/** If WebGL is unavailable, fall back to the plain ink background instead of crashing. */
class SafeCanvas extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function ShaderScene({ preset = 'hero', animate = true, pixelDensity = 1, scrim = 'none' }: Props) {
  const p = PRESETS[preset];
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0B1015', pointerEvents: 'none' }}>
      <style>{`html,body{margin:0;height:100%;background:#0B1015;overflow:hidden}
        @keyframes abhi-fade{from{opacity:0}to{opacity:1}}`}</style>
      <div style={{ position: 'absolute', inset: 0, animation: 'abhi-fade 900ms cubic-bezier(0.22,1,0.36,1) both' }}>
        <SafeCanvas>
          <ShaderGradientCanvas style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} pixelDensity={pixelDensity} fov={45}>
            <ShaderGradient control="props" animate={animate ? 'on' : 'off'} {...p} />
          </ShaderGradientCanvas>
        </SafeCanvas>
      </div>
      {scrim !== 'none' && <div style={{ position: 'absolute', inset: 0, backgroundImage: SCRIMS[scrim] }} />}
    </div>
  );
}
