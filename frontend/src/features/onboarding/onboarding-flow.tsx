import { Check } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { BackHandler, Platform, Pressable, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadingScreen } from '@/components/loading-screen';
import { Button } from '@/components/ui/button';
import { Notice, ProgressBar, Wordmark } from '@/components/ui/misc';
import { Text } from '@/components/ui/text';
import { Motion, Radius } from '@/constants/theme';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';
import { emptyProfile, type UserProfile } from '@/lib/profile/types';
import { useAuth } from '@/providers/auth-provider';

import { STEPS } from './steps';

export function OnboardingFlow() {
  const auth = useAuth();
  if (auth.status !== 'signedIn') return <LoadingScreen />;
  return <Flow />;
}

function Flow() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useLayout();
  const { user, profile, mode, saveProfile, completeOnboarding, signOut, sendVerification, reloadUser } = useAuth();

  const initial = useMemo(() => profile ?? emptyProfile(user?.displayName ?? ''), [profile, user]);
  const [draft, setDraft] = useState<UserProfile>(() => ({ ...initial, displayName: initial.displayName || user?.displayName || '' }));
  const [step, setStep] = useState(() => Math.min(Math.max(0, initial.onboarding.lastStep), STEPS.length - 1));
  const [reached, setReached] = useState(step);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);

  const def = STEPS[step];
  const last = step === STEPS.length - 1;

  const go = (next: number) => {
    setError(null);
    setStep(next);
    setReached((r) => Math.max(r, next));
    scroller.current?.scrollTo({ y: 0, animated: false });
  };

  const next = async (skip = false) => {
    const problem = skip ? null : (def.validate?.(draft) ?? null);
    if (problem) return setError(problem);
    if (last) {
      setFinishing(true);
      await completeOnboarding(draft);
      return; // the router guard opens /home
    }
    const target = step + 1;
    const saved = { ...draft, onboarding: { ...draft.onboarding, lastStep: target } };
    setDraft(saved);
    saveProfile(saved).catch(() => undefined);
    go(target);
  };

  const back = () => step > 0 && go(step - 1);

  // Android back button steps back through onboarding instead of leaving it.
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stepRef.current === 0) return false;
      go(stepRef.current - 1);
      return true;
    });
    return () => sub.remove();
  }, []);

  const Body = def.Body;
  const counted = STEPS.length - 2; // welcome and review are not "questions"
  const progress = step / (STEPS.length - 1);

  const footer = (
    <View style={[styles.footer, { borderColor: t.border, backgroundColor: t.background, paddingBottom: insets.bottom + 16 }]}>
      <View style={[styles.footerInner, isDesktop && { paddingHorizontal: 0 }]}>
        {step > 0 ? <Button label="Back" variant="ghost" onPress={back} /> : <View />}
        <View style={styles.footerRight}>
          {def.optional && <Button label="Skip" variant="ghost" onPress={() => next(true)} />}
          <Button label={last ? 'Open Abhimanyu' : step === 0 ? 'Start' : 'Continue'} onPress={() => next()} loading={finishing} />
        </View>
      </View>
    </View>
  );

  const content = (
    <Animated.View key={def.id} entering={FadeIn.duration(Motion.enter).easing(Motion.easing)} style={styles.content}>
      <View style={styles.heading}>
        {step > 0 && step < STEPS.length - 1 && (
          <Text variant="meta" mono tone="textMuted">
            {`Step ${step} of ${counted}${def.optional ? ' · optional' : ''}`}
          </Text>
        )}
        <Text variant="title" accessibilityRole="header">
          {def.title}
        </Text>
        <Text variant="body" tone="textSecondary">
          {def.subtitle}
        </Text>
      </View>
      <Body p={draft} set={(fn) => setDraft((d) => fn(d))} user={user} mode={mode} actions={{ resendVerification: sendVerification, reloadUser }} />
      {error && <Notice tone="critical">{error}</Notice>}
    </Animated.View>
  );

  return (
    <View style={[styles.root, { backgroundColor: t.background, paddingTop: insets.top }]}>
      <View style={[styles.topBar, { borderColor: t.border }]}>
        <Wordmark />
        <Button label="Sign out" size="sm" variant="ghost" onPress={() => signOut()} />
      </View>
      {!isDesktop && <ProgressBar value={progress} />}

      <View style={styles.body}>
        {isDesktop && (
          <View style={[styles.rail, { borderColor: t.border }]}>
            {STEPS.map((s, i) => {
              const done = i < step;
              const current = i === step;
              const reachable = i <= reached && !current;
              return (
                <Pressable
                  key={s.id}
                  disabled={!reachable}
                  onPress={() => go(i)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: current, disabled: !reachable }}
                  style={[
                    styles.railItem,
                    current && { backgroundColor: t.backgroundSelected },
                    reachable && Platform.OS === 'web' && ({ cursor: 'pointer' } as ViewStyle),
                  ]}>
                  <View style={styles.railIcon}>
                    {done ? (
                      <Check size={14} strokeWidth={2} color={t.accent} />
                    ) : (
                      <View style={[styles.railDot, { backgroundColor: current ? t.accent : t.borderStrong }]} />
                    )}
                  </View>
                  <Text variant="small" weight={current ? 'medium' : 'regular'} tone={current ? 'text' : done ? 'textSecondary' : 'textMuted'}>
                    {s.nav}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
        <View style={{ flex: 1 }}>
          <ScrollView ref={scroller} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.scroll, isDesktop && styles.scrollDesktop]}>
            <View style={styles.column}>{content}</View>
          </ScrollView>
          <View style={isDesktop ? styles.columnFooter : undefined}>{footer}</View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1 },
  body: { flex: 1, flexDirection: 'row' },
  rail: { width: 248, paddingVertical: 32, paddingHorizontal: 16, gap: 2, borderRightWidth: 1 },
  railItem: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 36, paddingHorizontal: 12, borderRadius: Radius.md },
  railIcon: { width: 16, alignItems: 'center' },
  railDot: { width: 6, height: 6, borderRadius: 3 },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 32, paddingBottom: 40 },
  scrollDesktop: { paddingHorizontal: 48, paddingTop: 56 },
  column: { width: '100%', maxWidth: 680, alignSelf: 'flex-start' },
  columnFooter: { paddingHorizontal: 48 },
  content: { gap: 32 },
  heading: { gap: 8 },
  footer: { borderTopWidth: 1, paddingTop: 16 },
  footerInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, width: '100%', maxWidth: 680 },
  footerRight: { flexDirection: 'row', gap: 8 },
});
