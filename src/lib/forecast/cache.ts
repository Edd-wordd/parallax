/** Simple in-process TTL cache for forecast provider responses. */

const DEFAULT_TTL_MS = 45 * 60 * 1000;

type Entry<T> = { value: T; expiresAt: number };

const store = new Map<string, Entry<unknown>>();

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function cacheSet<T>(
  key: string,
  value: T,
  ttlMs: number = DEFAULT_TTL_MS,
): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function cacheKeyParts(parts: (string | number)[]): string {
  return parts.join(":");
}

/** Round lat/lon to 3 decimals for cache coalescing (~100 m). */
export function roundCoord(n: number): string {
  return n.toFixed(3);
}

/** Test helper — clears in-memory cache. */
export function cacheClearForTests(): void {
  store.clear();
}

export const FORECAST_CACHE_TTL_MS = DEFAULT_TTL_MS;
