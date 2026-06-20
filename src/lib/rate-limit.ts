import { redis } from "@/lib/redis";

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

const limits: Record<string, RateLimitConfig> = {
  auth: { maxRequests: 10, windowSeconds: 300 },
  api: { maxRequests: 100, windowSeconds: 60 },
  execute: { maxRequests: 30, windowSeconds: 60 },
};

function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

const SLIDING_WINDOW_SCRIPT = `
local key = KEYS[1]
local window = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local count = redis.call('ZCARD', key)

if count < limit then
  redis.call('ZADD', key, now, now .. '-' .. math.random(1000000))
  redis.call('EXPIRE', key, window)
  return {1, limit - count - 1, window}
else
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local reset = oldest[2] and (tonumber(oldest[2]) + window - now) or window
  return {0, 0, reset}
end
`;

const inMemoryLimits = new Map<string, { count: number; reset: number }>();

function cleanupMemoryLimits(): void {
  const now = Date.now();
  for (const [key, data] of inMemoryLimits) {
    if (now > data.reset) {
      inMemoryLimits.delete(key);
    }
  }
  if (inMemoryLimits.size > 2000) {
    const keys = Array.from(inMemoryLimits.keys()).slice(0, 500);
    keys.forEach((k) => inMemoryLimits.delete(k));
  }
}

export async function rateLimit(
  request: Request,
  zone: keyof typeof limits = "api"
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const cfg = limits[zone];
  const ip = getClientIp(request);
  const key = `rate:${zone}:${ip}`;
  const now = Date.now();

  try {
    if (!redis || redis.status !== "ready") {
      const record = inMemoryLimits.get(key);
      if (!record || now > record.reset) {
        inMemoryLimits.set(key, { count: 1, reset: now + cfg.windowSeconds * 1000 });
        return { allowed: true, remaining: cfg.maxRequests - 1, reset: now + cfg.windowSeconds * 1000 };
      }
      record.count++;
      const allowed = record.count <= cfg.maxRequests;
      return { allowed, remaining: Math.max(0, cfg.maxRequests - record.count), reset: record.reset };
    }

    const result = await redis.eval(
      SLIDING_WINDOW_SCRIPT,
      1,
      key,
      cfg.windowSeconds.toString(),
      cfg.maxRequests.toString(),
      now.toString()
    ) as [number, number, number];

    const allowed = result[0] === 1;
    const remaining = result[1];
    const resetMs = now + result[2] * 1000;

    return { allowed, remaining, reset: resetMs };
  } catch {
    cleanupMemoryLimits();
    return { allowed: true, remaining: cfg.maxRequests, reset: 0 };
  }
}
