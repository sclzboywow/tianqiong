const DEFAULT_TTL_MS = 20_000;

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

export function withContentOrchestrationCache<T>(
  key: string,
  loader: () => Promise<T>,
  options: { refresh?: boolean; ttlMs?: number } = {},
): Promise<T> {
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  if (!options.refresh) {
    const hit = cache.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      return Promise.resolve(hit.data as T);
    }
  }

  return loader().then((data) => {
    cache.set(key, { data, expiresAt: Date.now() + ttlMs });
    return data;
  });
}

export function bustContentOrchestrationCache() {
  cache.clear();
}
