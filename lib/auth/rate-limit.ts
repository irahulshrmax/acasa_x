// lib/rate-limit.ts
interface RateLimitOptions {
  interval: number;
  uniqueTokenPerInterval: number;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new Map<string, RateLimitRecord>();
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of tokenCache.entries()) {
      if (now > record.resetTime) {
        tokenCache.delete(key);
      }
    }
  }, options.interval);

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return {
    check: async (request: Request, limit: number, token: string): Promise<void> => {
      const now = Date.now();
      const resetTime = now + options.interval;

      const cached = tokenCache.get(token);
      
      if (!cached || now > cached.resetTime) {
        tokenCache.set(token, { count: 1, resetTime });
        return Promise.resolve();
      }

      if (cached.count >= limit) {
        const retryAfter = Math.ceil((cached.resetTime - now) / 1000);
        return Promise.reject({
          message: 'Rate limit exceeded',
          retryAfter,
        });
      }

      cached.count += 1;
      tokenCache.set(token, cached);
      return Promise.resolve();
    },

    clear: (token?: string): void => {
      if (token) {
        tokenCache.delete(token);
      } else {
        tokenCache.clear();
      }
    },

    getStats: (): { total: number; active: number } => {
      const now = Date.now();
      let active = 0;
      for (const record of tokenCache.values()) {
        if (now <= record.resetTime) {
          active++;
        }
      }
      return {
        total: tokenCache.size,
        active,
      };
    },
  };
}