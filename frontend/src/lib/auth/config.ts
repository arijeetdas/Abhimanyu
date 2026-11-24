import type { AuthMode } from './types';

/**
 * Firebase web app config. Get the values from the Firebase console:
 * Project settings > General > Your apps > Web app > SDK setup and configuration > Config.
 * Put them in frontend/.env.local (never committed). These values identify the project; they are
 * not secrets, but keep them out of Git anyway so each environment can point at its own project.
 *
 * Expo only inlines EXPO_PUBLIC_* variables written out in full like this (no destructuring).
 */
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? '',
};

/** Use Firestore for profiles (users/{uid}) when Firebase is configured. Set to "false" to keep profiles local. */
export const useFirestoreProfiles = (process.env.EXPO_PUBLIC_FIREBASE_USE_FIRESTORE ?? 'true') !== 'false';

export const firebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

/** EXPO_PUBLIC_AUTH_MODE=demo forces demo mode even when Firebase is configured. */
export const authMode: AuthMode = process.env.EXPO_PUBLIC_AUTH_MODE === 'demo' || !firebaseConfigured ? 'demo' : 'firebase';
