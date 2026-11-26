import { Link } from 'expo-router';
import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ShaderBackdrop } from '@/components/backdrop/shader-backdrop';
import { EvidenceTag, Notice, Wordmark } from '@/components/ui/misc';
import { Text } from '@/components/ui/text';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/providers/auth-provider';

/** Shared frame for log in, register and password reset. */
export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer?: ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useLayout();
  const { mode } = useAuth();

  const form = (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}>
      <View style={styles.top}>
        {Platform.OS === 'web' ? (
          <Link href="/" accessibilityLabel="Abhimanyu home">
            <Wordmark />
          </Link>
        ) : (
          <Wordmark />
        )}
      </View>
      <View style={styles.formWrap}>
        <View style={styles.form}>
          <View style={styles.heading}>
            <Text variant="title" accessibilityRole="header">
              {title}
            </Text>
            <Text variant="body" tone="textSecondary">
              {subtitle}
            </Text>
          </View>
          {children}
          {mode === 'demo' && (
            <Notice>
              <Text variant="caption" tone="textSecondary">
                Demo mode: accounts and profiles are saved only on this device. Connect Firebase to enable cloud accounts and profile sync.
              </Text>
            </Notice>
          )}
        </View>
      </View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </ScrollView>
  );

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.formCol, isDesktop && { maxWidth: 560 }]}>
        {form}
      </KeyboardAvoidingView>
      {isDesktop && (
        <View style={[styles.art, { borderColor: t.border }]}>
          <ShaderBackdrop preset="calm" scrim="bottom" />
          <View style={styles.artCaption}>
            <Text variant="heading" style={{ maxWidth: 420 }}>
              Every flag comes with the page it was found on
            </Text>
            <View style={styles.artRow}>
              <EvidenceTag>AR FY25 · p.142</EvidenceTag>
              <Text variant="caption" tone="textSecondary">
                Auditor note on trade receivables
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  formCol: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  top: { height: 40, justifyContent: 'center' },
  formWrap: { flex: 1, justifyContent: 'center', paddingVertical: 40 },
  form: { width: '100%', maxWidth: 400, alignSelf: 'center', gap: 24 },
  heading: { gap: 8 },
  footer: { alignItems: 'center' },
  art: { flex: 1.1, margin: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 1, justifyContent: 'flex-end' },
  artCaption: { padding: 40, gap: 16 },
  artRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
