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

export async function rateLimit(
  request: Request,
  zone: keyof typeof limits = "api"
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const cfg = limits[zone];
  const ip = getClientIp(request);
  const key = `rate:${zone}:${ip}`;

  try {
    if (!redis || redis.status !== "ready") {
      return { allowed: true, remaining: cfg.maxRequests, reset: 0 };
    }

    const multi = redis.multi();
    multi.incr(key);
    multi.ttl(key);
    const results = await multi.exec();

    if (!results) {
      return { allowed: true, remaining: cfg.maxRequests, reset: 0 };
    }

    const count = results[0]?.[1] as number ?? 1;
    let ttl = results[1]?.[1] as number ?? cfg.windowSeconds;

    if (count === 1) {
      await redis.expire(key, cfg.windowSeconds);
      ttl = cfg.windowSeconds;
    }

    const remaining = Math.max(0, cfg.maxRequests - count);
    const allowed = count <= cfg.maxRequests;

    return { allowed, remaining, reset: Math.ceil(Date.now() / 1000) + ttl };
  } catch {
    return { allowed: true, remaining: cfg.maxRequests, reset: 0 };
  }
}
