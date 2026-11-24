import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { authMode } from '@/lib/auth/config';
import type { AuthBackend, AuthMode, AuthUser, RegisterInput } from '@/lib/auth/types';
import { emptyProfile, normalizeProfile, type UserProfile } from '@/lib/profile/types';
import { getJSON, setJSON } from '@/lib/storage';

type Status = 'loading' | 'signedOut' | 'signedIn';

type AuthContextValue = {
  status: Status;
  mode: AuthMode;
  user: AuthUser | null;
  profile: UserProfile | null;
  onboarded: boolean;
  signIn(email: string, password: string): Promise<void>;
  register(input: RegisterInput): Promise<void>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  sendVerification(): Promise<void>;
  reloadUser(): Promise<void>;
  /** Save progress without finishing onboarding. */
  saveProfile(profile: UserProfile): Promise<void>;
  completeOnboarding(profile: UserProfile): Promise<void>;
  restartOnboarding(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const localKey = (uid: string) => `abhimanyu.profile.${uid}`;

let backendPromise: Promise<AuthBackend> | null = null;
function getBackend(): Promise<AuthBackend> {
  backendPromise ??= (async () => {
    if (authMode === 'firebase') {
      try {
        const { createFirebaseBackend } = await import('@/lib/auth/firebase-backend');
        return await createFirebaseBackend();
      } catch (e) {
        console.warn('[auth] Firebase failed to start, using demo mode instead.', e);
      }
    }
    const { createDemoBackend } = await import('@/lib/auth/demo-backend');
    return createDemoBackend();
  })();
  return backendPromise;
}

async function loadProfile(backend: AuthBackend, user: AuthUser): Promise<UserProfile | null> {
  let raw: Partial<UserProfile> | null = null;
  if (backend.loadRemoteProfile) {
    try {
      raw = await backend.loadRemoteProfile(user.uid);
    } catch (e) {
      console.warn('[profile] Firestore read failed, using the copy on this device.', e);
    }
  }
  raw ??= await getJSON<Partial<UserProfile>>(localKey(user.uid));
  return raw ? normalizeProfile(raw, user.displayName) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [mode, setMode] = useState<AuthMode>(authMode);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const backendRef = useRef<AuthBackend | null>(null);
  // While registering, wait for the starter profile before reporting "signed in".
  const registering = useRef<Promise<unknown> | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let alive = true;
    getBackend().then((backend) => {
      if (!alive) return;
      backendRef.current = backend;
      setMode(backend.mode);
      unsub = backend.subscribe(async (u) => {
        if (!u) {
          setUser(null);
          setProfile(null);
          setStatus('signedOut');
          return;
        }
        if (registering.current) await registering.current.catch(() => undefined);
        const p = await loadProfile(backend, u);
        setUser(u);
        setProfile(p);
        setStatus('signedIn');
      });
    });
    return () => {
      alive = false;
      unsub?.();
    };
  }, []);

  const backend = async () => backendRef.current ?? (await getBackend());

  const persist = useCallback(async (p: UserProfile) => {
    const b = await backend();
    const u = user;
    if (!u) return;
    const next = { ...p, updatedAt: new Date().toISOString() };
    setProfile(next);
    await setJSON(localKey(u.uid), next);
    if (b.saveRemoteProfile) {
      b.saveRemoteProfile(u.uid, next).catch((e) => console.warn('[profile] Firestore write failed; kept on this device.', e));
    }
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      mode,
      user,
      profile,
      onboarded: !!profile?.onboarding.completedAt,
      async signIn(email, password) {
        await (await backend()).signIn(email, password);
      },
      async register(input) {
        const b = await backend();
        let done!: () => void;
        registering.current = new Promise<void>((r) => (done = r));
        try {
          const u = await b.register(input);
          const starter = emptyProfile(input.name.trim());
          starter.consents.termsAcceptedAt = new Date().toISOString();
          await setJSON(localKey(u.uid), starter);
          b.saveRemoteProfile?.(u.uid, starter).catch(() => undefined);
        } finally {
          done();
          registering.current = null;
        }
      },
      async signOut() {
        await (await backend()).signOut();
      },
      async resetPassword(email) {
        await (await backend()).resetPassword(email);
      },
      async sendVerification() {
        await (await backend()).sendVerification();
      },
      async reloadUser() {
        const u = await (await backend()).reloadUser();
        if (u) setUser(u);
      },
      saveProfile: persist,
      async completeOnboarding(p) {
        await persist({ ...p, onboarding: { ...p.onboarding, completedAt: new Date().toISOString() } });
      },
      async restartOnboarding() {
        if (profile) await persist({ ...profile, onboarding: { ...profile.onboarding, completedAt: null, lastStep: 0 } });
      },
    }),
    [status, mode, user, profile, persist],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
