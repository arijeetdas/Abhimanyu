import { Check } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Text } from './text';

type WebState = { pressed: boolean; hovered?: boolean };
const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : null;

/** A selectable card: radio (one of many) or checkbox (any of many). */
export function ChoiceCard({
  title,
  description,
  selected,
  onPress,
  multi = false,
  meta,
  style,
}: {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  multi?: boolean;
  meta?: ReactNode;
  style?: ViewStyle;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={multi ? { checked: selected } : { selected }}
      style={[pointer, style]}>
      {(s) => {
        const state = s as unknown as WebState;
        return (
          <View
            style={[
              styles.card,
              {
                backgroundColor: selected ? t.backgroundSelected : state.hovered ? 'rgba(24, 35, 45, 0.6)' : t.backgroundElement,
                borderColor: selected ? t.accent : t.border,
              },
              state.pressed && { transform: [{ scale: 0.99 }] },
            ]}>
            <Indicator multi={multi} selected={selected} />
            <View style={styles.cardText}>
              <Text variant="body" weight="medium">
                {title}
              </Text>
              {description ? (
                <Text variant="caption" tone="textSecondary">
                  {description}
                </Text>
              ) : null}
              {meta}
            </View>
          </View>
        );
      }}
    </Pressable>
  );
}

function Indicator({ multi, selected }: { multi: boolean; selected: boolean }) {
  const t = useTheme();
  return (
    <View
      style={[
        styles.indicator,
        multi ? { borderRadius: Radius.xs } : { borderRadius: 9 },
        { borderColor: selected ? t.accent : t.borderStrong, backgroundColor: selected && multi ? t.accent : 'transparent' },
      ]}>
      {selected && (multi ? <Check size={12} strokeWidth={2.5} color={t.onAccent} /> : <View style={[styles.dot, { backgroundColor: t.accent }]} />)}
    </View>
  );
}

/** Compact toggle pill for tags such as sectors or tickers. */
export function Chip({ label, selected, onPress, accessory }: { label: string; selected: boolean; onPress: () => void; accessory?: ReactNode }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} style={pointer}>
      {(s) => {
        const state = s as unknown as WebState;
        return (
          <View
            style={[
              styles.chip,
              {
                backgroundColor: selected ? 'rgba(66, 214, 164, 0.12)' : state.hovered ? t.backgroundSelected : t.backgroundElement,
                borderColor: selected ? 'rgba(66, 214, 164, 0.55)' : t.border,
              },
            ]}>
            {selected && <Check size={14} strokeWidth={2} color={t.accent} />}
            <Text variant="small" weight={selected ? 'medium' : 'regular'} tone={selected ? 'text' : 'textSecondary'}>
              {label}
            </Text>
            {accessory}
          </View>
        );
      }}
    </Pressable>
  );
}

/** A labelled checkbox row, used for consents. */
export function CheckRow({
  checked,
  onToggle,
  children,
  error,
}: {
  checked: boolean;
  onToggle: () => void;
  children: ReactNode;
  error?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked }} style={[styles.checkRow, pointer]}>
      <View
        style={[
          styles.indicator,
          { borderRadius: Radius.xs, marginTop: 2 },
          { borderColor: error ? t.critical : checked ? t.accent : t.borderStrong, backgroundColor: checked ? t.accent : 'transparent' },
        ]}>
        {checked && <Check size={12} strokeWidth={2.5} color={t.onAccent} />}
      </View>
      <View style={styles.cardText}>{children}</View>
    </Pressable>
  );
}

/** Two to four mutually exclusive options in one row. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const t = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: t.backgroundDeep, borderColor: t.border }]} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            style={[styles.segment, pointer, on && { backgroundColor: t.backgroundSelected, borderColor: t.borderStrong }]}>
            <Text variant="small" weight={on ? 'medium' : 'regular'} tone={on ? 'text' : 'textSecondary'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  cardText: { flex: 1, gap: 4 },
  indicator: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 4 },
  segmented: { flexDirection: 'row', padding: 4, borderRadius: Radius.md, borderWidth: 1, gap: 4, alignSelf: 'flex-start' },
  segment: {
    paddingHorizontal: 12,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
});
