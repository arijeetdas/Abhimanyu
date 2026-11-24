import { Link, type Href } from 'expo-router';
import { type ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Text } from './text';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'sm';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  href?: Href;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
};

type WebState = { pressed: boolean; hovered?: boolean };

export function Button({
  label,
  onPress,
  href,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  icon,
  iconRight,
  fullWidth,
  style,
  accessibilityHint,
}: ButtonProps) {
  const t = useTheme();
  const inactive = disabled || loading;

  const surface = (state: WebState): ViewStyle => {
    if (variant === 'primary') {
      return {
        backgroundColor: inactive ? t.surfaceHover : state.pressed ? t.accentPressed : state.hovered ? t.accentHover : t.accent,
      };
    }
    if (variant === 'secondary') {
      return {
        backgroundColor: state.pressed ? t.surfaceHover : state.hovered ? t.backgroundSelected : 'rgba(18, 26, 34, 0.72)',
        borderColor: t.borderStrong,
        borderWidth: StyleSheet.hairlineWidth * 2,
      };
    }
    return { backgroundColor: state.pressed || state.hovered ? 'rgba(232, 238, 243, 0.06)' : 'transparent' };
  };

  const textTone = variant === 'primary' ? (inactive ? 'textMuted' : 'onAccent') : inactive ? 'textMuted' : 'text';

  const body = (state: WebState) => (
    <View
      style={[
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        surface(state),
        state.pressed && !inactive && { transform: [{ scale: 0.98 }] },
        fullWidth && styles.full,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? t.onAccent : t.text} />
      ) : (
        <>
          {icon}
          <Text variant={size === 'sm' ? 'small' : 'body'} weight="medium" tone={textTone}>
            {label}
          </Text>
          {iconRight}
        </>
      )}
    </View>
  );

  const pressable = (
    <Pressable
      onPress={inactive ? undefined : onPress}
      disabled={inactive}
      accessibilityRole={href ? 'link' : 'button'}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      accessibilityHint={accessibilityHint}
      // Flattened: <Link asChild> (expo-router Slot) rejects style arrays on its child.
      style={StyleSheet.flatten([fullWidth && styles.full, Platform.OS === 'web' && ({ cursor: inactive ? 'default' : 'pointer' } as ViewStyle)])}>
      {(state) => body(state as unknown as WebState)}
    </Pressable>
  );

  if (href && !inactive) {
    return (
      <Link href={href} asChild>
        {pressable}
      </Link>
    );
  }
  return pressable;
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.md,
  },
  md: { height: 48, paddingHorizontal: 20 },
  sm: { height: 36, paddingHorizontal: 16 },
  full: { alignSelf: 'stretch' },
});
