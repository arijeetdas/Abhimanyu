import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/** AsyncStorage (localStorage on web). Safe to call during static rendering: it just returns null. */
const available = () => Platform.OS !== 'web' || typeof window !== 'undefined';

export async function getJSON<T>(key: string): Promise<T | null> {
  if (!available()) return null;
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function setJSON(key: string, value: unknown): Promise<void> {
  if (!available()) return;
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeKey(key: string): Promise<void> {
  if (!available()) return;
  await AsyncStorage.removeItem(key);
}
