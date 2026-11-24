import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Where the FastAPI backend lives.
 * 1. EXPO_PUBLIC_API_URL (set it in frontend/.env.local) always wins.
 * 2. On a phone / emulator in development, use the dev machine's LAN IP that Expo already knows,
 *    because "localhost" on a phone means the phone itself.
 * 3. Otherwise (web in the browser) use localhost.
 */
function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (Platform.OS !== 'web' && devHost) return `http://${devHost}:8000`;

  return 'http://localhost:8000';
}

export const API_BASE_URL = resolveApiBaseUrl();
export const API_V1 = `${API_BASE_URL}/api/v1`;

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

export async function apiGet<T>(path: string, timeoutMs = 5000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(path.startsWith('http') ? path : `${API_BASE_URL}${path}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new ApiError(`Request failed with ${res.status}`, res.status);
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(controller.signal.aborted ? 'Timed out' : 'Network error');
  } finally {
    clearTimeout(timer);
  }
}
