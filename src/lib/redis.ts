import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

function createRedis(): Redis {
  const url = process.env.REDIS_URL;
  if (!url) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("REDIS_URL is required in production");
    }
    return null as unknown as Redis;
  }

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
}

export const redis = globalForRedis.redis ?? createRedis();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

function isAvailable(): boolean {
  return !!(redis && redis.status === "ready");
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!isAvailable()) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!isAvailable()) return;
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // silently fail
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (!isAvailable()) return;
  try {
    await redis.del(key);
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
