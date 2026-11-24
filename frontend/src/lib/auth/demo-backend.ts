import * as Crypto from 'expo-crypto';

import { getJSON, removeKey, setJSON } from '@/lib/storage';

import { AuthError, type AuthBackend, type AuthUser } from './types';

/**
 * Demo mode: accounts live only on this device (AsyncStorage / localStorage) until Firebase is
 * configured. Passwords are stored as salted SHA-256 hashes, never in plain text.
 */
type StoredUser = AuthUser & { salt: string; hash: string };

const USERS = 'abhimanyu.demo.users';
const SESSION = 'abhimanyu.demo.session';

const hash = (salt: string, password: string) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);
const publicUser = ({ salt: _s, hash: _h, ...u }: StoredUser): AuthUser => u;
const key = (email: string) => email.trim().toLowerCase();

export function createDemoBackend(): AuthBackend {
  const listeners = new Set<(u: AuthUser | null) => void>();
  let current: AuthUser | null = null;
  const emit = () => listeners.forEach((l) => l(current));

  const users = async () => (await getJSON<Record<string, StoredUser>>(USERS)) ?? {};

  return {
    mode: 'demo',
    subscribe(cb) {
      listeners.add(cb);
      (async () => {
        const uid = await getJSON<string>(SESSION);
        const all = await users();
        const found = Object.values(all).find((u) => u.uid === uid);
        current = found ? publicUser(found) : null;
        cb(current);
      })();
      return () => listeners.delete(cb);
    },
    async signIn(email, password) {
      const u = (await users())[key(email)];
      if (!u || (await hash(u.salt, password)) !== u.hash) throw new AuthError('auth/invalid-credential', 'Invalid credentials');
      current = publicUser(u);
      await setJSON(SESSION, u.uid);
      emit();
      return current;
    },
    async register({ name, email, password }) {
      const all = await users();
      const k = key(email);
      if (all[k]) throw new AuthError('auth/email-already-in-use', 'Email in use');
      const salt = Crypto.randomUUID();
      const stored: StoredUser = {
        uid: `demo-${Crypto.randomUUID()}`,
        email: email.trim(),
        displayName: name.trim(),
        emailVerified: true,
        createdAt: new Date().toISOString(),
        salt,
        hash: await hash(salt, password),
      };
      all[k] = stored;
      await setJSON(USERS, all);
      await setJSON(SESSION, stored.uid);
      current = publicUser(stored);
      emit();
      return current;
    },
    async signOut() {
      await removeKey(SESSION);
      current = null;
      emit();
    },
    async resetPassword() {
      // Nothing to send in demo mode; the UI explains this.
    },
    async sendVerification() {},
    async reloadUser() {
      return current;
    },
  };
}
