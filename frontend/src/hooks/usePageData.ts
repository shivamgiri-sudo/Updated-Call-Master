import { useState, useEffect, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const TTL = 60_000; // 60 seconds

export function usePageData<T>(
  key: string,
  fetchFn: () => Promise<T>
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    // Check cache first
    const cached = cache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < TTL) {
      // Cache hit - return synchronously
      setData(cached.data);
      setLoading(false);
      setError(null);
      return;
    }

    // Cache miss - fetch data
    setLoading(true);
    setError(null);

    let cancelled = false;

    try {
      const result = await fetchFn();

      if (!cancelled) {
        // Update cache
        cache.set(key, {
          data: result,
          timestamp: Date.now(),
        });

        setData(result);
        setLoading(false);
      }
    } catch (err) {
      if (!cancelled) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [key, fetchFn]);

  const refresh = useCallback(() => {
    // Clear cache entry
    cache.delete(key);
    // Re-fetch
    load();
  }, [key, load]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const runLoad = async () => {
      cleanup = (await load()) as (() => void) | undefined;
    };

    runLoad();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [load]);

  return { data, loading, error, refresh };
}
