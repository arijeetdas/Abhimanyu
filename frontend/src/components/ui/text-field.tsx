import { forwardRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View, type TextInputProps, type TextStyle } from 'react-native';

import { FontFamily, Radius, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Text } from './text';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  hint?: string;
  optional?: boolean;
  /** Adds a Show / Hide toggle and hides the value by default. */
  password?: boolean;
  accessory?: ReactNode;
};

export const TextField = forwardRef<ComponentRef<typeof TextInput>, TextFieldProps>(function TextField(
  { label, error, hint, optional, password, accessory, style, onFocus, onBlur, ...rest },
  ref,
) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  const borderColor = error ? t.critical : focused ? t.accent : t.borderStrong;

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text variant="small" weight="medium" tone="textSecondary">
          {label}
        </Text>
        {optional && (
          <Text variant="meta" tone="textMuted">
            Optional
          </Text>
        )}
      </View>
      <View style={[styles.field, { backgroundColor: t.backgroundSelected, borderColor }]}>
        <TextInput
          ref={ref}
          placeholderTextColor={t.textMuted}
          secureTextEntry={password ? hidden : rest.secureTextEntry}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          accessibilityLabel={label}
          style={[
            styles.input,
            { color: t.text, fontFamily: FontFamily.sans },
            Platform.OS === 'web' && ({ outlineStyle: 'none' } as unknown as TextStyle),
            style,
          ]}
          {...rest}
        />
        {password && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            hitSlop={8}
            style={styles.toggle}>
            <Text variant="caption" weight="medium" tone="textSecondary">
              {hidden ? 'Show' : 'Hide'}
            </Text>
          </Pressable>
        )}
        {accessory}
      </View>
      {error ? (
        <Text variant="caption" tone="critical" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="textMuted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 48,
  },
  input: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, ...Type.body },
  toggle: { paddingHorizontal: 16, height: 48, justifyContent: 'center' },
});
