import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { FontFamily, type ThemeColor, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextVariant = keyof typeof Type;
type Weight = 'regular' | 'medium' | 'semibold';

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  tone?: ThemeColor;
  weight?: Weight;
  mono?: boolean;
  align?: TextStyle['textAlign'];
};

const family = (weight: Weight, mono: boolean) => {
  if (mono) return weight === 'regular' ? FontFamily.mono : FontFamily.monoMedium;
  return weight === 'semibold' ? FontFamily.sansSemiBold : weight === 'medium' ? FontFamily.sansMedium : FontFamily.sans;
};

/** The one text component. Hierarchy comes from size and tone; weights stay 400-600. */
export function Text({ variant = 'body', tone = 'text', weight, mono = false, align, style, ...rest }: TextProps) {
  const theme = useTheme();
  const w: Weight = weight ?? (variant === 'display' || variant === 'displayMobile' || variant === 'title' || variant === 'heading' ? 'medium' : 'regular');
  return (
    <RNText
      style={[
        Type[variant],
        { color: theme[tone], fontFamily: family(w, mono), textAlign: align },
        mono && { fontVariant: ['tabular-nums'] },
        style,
      ]}
      {...rest}
    />
  );
}
