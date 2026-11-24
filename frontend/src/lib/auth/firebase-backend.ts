import { Platform } from 'react-native';

import type { UserProfile } from '@/lib/profile/types';

import { firebaseConfig, useFirestoreProfiles } from './config';
import { createFirebaseAuth } from './firebase-auth-init';
import type { AuthBackend, AuthUser } from './types';

/**
 * Firebase Authentication (email + password) and an optional Firestore copy of the profile.
 * Loaded lazily, so demo mode never downloads the Firebase SDK.
 */
export async function createFirebaseBackend(): Promise<AuthBackend> {
  const { initializeApp, getApps, getApp } = await import('firebase/app');
  const A = await import('firebase/auth');
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = await createFirebaseAuth(app);

  const map = (u: import('firebase/auth').User): AuthUser => ({
    uid: u.uid,
    email: u.email ?? '',
    displayName: u.displayName ?? '',
    emailVerified: u.emailVerified,
    createdAt: u.metadata.creationTime ? new Date(u.metadata.creationTime).toISOString() : null,
  });

  // Firestore is optional: if it is not enabled or the rules reject us, profiles stay local.
  let db: import('firebase/firestore').Firestore | null = null;
  const firestore = async () => {
    if (!useFirestoreProfiles) return null;
    if (db) return db;
    const F = await import('firebase/firestore');
    try {
      db = Platform.OS === 'web' ? F.getFirestore(app) : F.initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
    } catch {
      db = F.getFirestore(app);
    }
    return db;
  };

  return {
    mode: 'firebase',
    subscribe(cb) {
      return A.onAuthStateChanged(auth, (u) => cb(u ? map(u) : null));
    },
    async signIn(email, password) {
      const cred = await A.signInWithEmailAndPassword(auth, email.trim(), password);
      return map(cred.user);
    },
    async register({ name, email, password }) {
      const cred = await A.createUserWithEmailAndPassword(auth, email.trim(), password);
      await A.updateProfile(cred.user, { displayName: name.trim() });
      A.sendEmailVerification(cred.user).catch(() => undefined);
      return { ...map(cred.user), displayName: name.trim() };
    },
    async signOut() {
      await A.signOut(auth);
    },
    async resetPassword(email) {
      await A.sendPasswordResetEmail(auth, email.trim());
    },
    async sendVerification() {
      if (auth.currentUser) await A.sendEmailVerification(auth.currentUser);
    },
    async reloadUser() {
      if (!auth.currentUser) return null;
      await auth.currentUser.reload();
      return map(auth.currentUser);
    },
    async loadRemoteProfile(uid) {
      const store = await firestore();
      if (!store) return null;
      const F = await import('firebase/firestore');
      const snap = await F.getDoc(F.doc(store, 'users', uid));
      return snap.exists() ? ((snap.data().profile as Partial<UserProfile>) ?? null) : null;
    },
    async saveRemoteProfile(uid, profile) {
      const store = await firestore();
      if (!store) return;
      const F = await import('firebase/firestore');
      // Firestore rejects undefined values; the JSON round trip drops them.
      const clean = JSON.parse(JSON.stringify(profile)) as UserProfile;
      await F.setDoc(
        F.doc(store, 'users', uid),
        { profile: clean, email: auth.currentUser?.email ?? null, updatedAt: F.serverTimestamp() },
        { merge: true },
      );
    },
  };
}
