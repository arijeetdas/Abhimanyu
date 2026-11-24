import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FirebaseApp } from 'firebase/app';

/**
 * Android / iOS: keep users signed in across app restarts with AsyncStorage.
 * getReactNativePersistence ships in Firebase's React Native build but is missing from the
 * default TypeScript types, hence the cast.
 */
export async function createFirebaseAuth(app: FirebaseApp) {
  const A = await import('firebase/auth');
  const getRNPersistence = (A as unknown as { getReactNativePersistence?: (s: typeof AsyncStorage) => import('firebase/auth').Persistence })
    .getReactNativePersistence;
  try {
    return getRNPersistence ? A.initializeAuth(app, { persistence: getRNPersistence(AsyncStorage) }) : A.getAuth(app);
  } catch {
    // initializeAuth throws if auth was already initialised (fast refresh).
    return A.getAuth(app);
  }
}
