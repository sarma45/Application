import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis | null | undefined };

function createRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) {
    return null;
  }

  try {
    const client = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    client.on("error", (err) => {
      console.warn("Redis connection error:", err.message);
    });

    return client;
  } catch {
    return null;
  }
}

export const redis: Redis | null = globalForRedis.redis ?? createRedis();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis ?? undefined;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = redis;
  if (!r || r.status !== "ready") return null;
  try {
    const data = await r.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const r = redis;
  if (!r || r.status !== "ready") return;
  try {
    await r.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // silently fail
  }
}

export async function cacheDel(key: string): Promise<void> {
  const r = redis;
  if (!r || r.status !== "ready") return;
  try {
    await r.del(key);
  } catch {
    // silently fail
  }
}

export const CACHE_TTL = {
  AGENT_DETAIL: 300,
  FEATURED_AGENTS: 600,
  WALLET: 30,
  SEARCH: 120,
} as const;
