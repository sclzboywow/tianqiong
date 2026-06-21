const DEFAULT_TTL_MS = 20_000;

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();
let generation = 0;

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

  const requestGeneration = generation;
  const requestKey = `${requestGeneration}:${key}`;
  const pending = inFlight.get(requestKey);
  if (pending) return pending as Promise<T>;

  const request = loader()
    .then((data) => {
      if (generation === requestGeneration) {
        cache.set(key, { data, expiresAt: Date.now() + ttlMs });
      }
      return data;
    })
    .finally(() => {
      inFlight.delete(requestKey);
    });

  inFlight.set(requestKey, request);
  return request;
}

export function bustContentOrchestrationCache() {
  generation += 1;
  cache.clear();
  inFlight.clear();
}
