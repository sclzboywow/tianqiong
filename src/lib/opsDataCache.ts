const DEFAULT_TTL_MS = 60_000;

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();
let generation = 0;

export type OpsDataCacheOptions = {
  refresh?: boolean;
  ttlMs?: number;
};

export function withOpsDataCache<T>(
  key: string,
  loader: () => Promise<T>,
  options: OpsDataCacheOptions = {},
): Promise<T> {
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;

  if (!options.refresh) {
    const hit = cache.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      return Promise.resolve(hit.data as T);
    }
  }

  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;

  const requestGeneration = generation;
  const request = loader()
    .then((data) => {
      if (generation === requestGeneration) {
        cache.set(key, { data, expiresAt: Date.now() + ttlMs });
      }
      return data;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, request);
  return request;
}

export function bustOpsDataCache(key?: string) {
  generation += 1;
  if (key) {
    cache.delete(key);
    inFlight.delete(key);
    return;
  }
  cache.clear();
  inFlight.clear();
}
