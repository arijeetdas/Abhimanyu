import { useCallback, useEffect, useState } from 'react';

import { apiGet } from '@/lib/api';

type Health = { status: string; version: string };
export type ApiHealthState =
  | { state: 'checking' }
  | { state: 'online'; version: string }
  | { state: 'offline'; reason: string };

/** Pings GET /health on mount and whenever recheck() is called. */
export function useApiHealth() {
  const [health, setHealth] = useState<ApiHealthState>({ state: 'checking' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiGet<Health>('/health').then(
      (res) => !cancelled && setHealth({ state: 'online', version: res.version }),
      (e: unknown) =>
        !cancelled &&
        setHealth({ state: 'offline', reason: e instanceof Error ? e.message : 'Unknown error' }),
    );
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const recheck = useCallback(() => {
    setHealth({ state: 'checking' });
    setAttempt((n) => n + 1);
  }, []);

  return { health, recheck };
}
