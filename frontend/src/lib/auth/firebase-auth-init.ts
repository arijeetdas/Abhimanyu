import type { FirebaseApp } from 'firebase/app';

/** Web: the default browser persistence (IndexedDB) keeps users signed in across reloads. */
export async function createFirebaseAuth(app: FirebaseApp) {
  const { getAuth } = await import('firebase/auth');
  return getAuth(app);
}
