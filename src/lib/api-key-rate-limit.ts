import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

export interface ApiKeyRateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  key: string;
}

const DEFAULT_TIERS: Record<string, ApiKeyRateLimitConfig> = {
  FREE: { maxRequests: 60, windowSeconds: 60, key: "FREE" },
  PRO: { maxRequests: 300, windowSeconds: 60, key: "PRO" },
  CREATOR: { maxRequests: 500, windowSeconds: 60, key: "CREATOR" },
  BUSINESS: { maxRequests: 1000, windowSeconds: 60, key: "BUSINESS" },
  ENTERPRISE: { maxRequests: 5000, windowSeconds: 60, key: "ENTERPRISE" },
};

export async function getApiKeyRateLimit(key: string): Promise<ApiKeyRateLimitConfig | null> {
  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { key },
      select: { isActive: true, userId: true },
    });

    if (!apiKey || !apiKey.isActive) return null;

    const user = await prisma.user.findUnique({
      where: { id: apiKey.userId },
      select: { plan: true },
    });

    if (!user) return null;

    return DEFAULT_TIERS[user.plan] || DEFAULT_TIERS.FREE;
  } catch {
    return DEFAULT_TIERS.FREE;
  }
}

export async function checkApiKeyRateLimit(
  apiKeyValue: string,
  config: ApiKeyRateLimitConfig
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  if (!redis || redis.status !== "ready") {
    return { allowed: true, remaining: config.maxRequests, reset: 0 };
  }

  const key = `apikey:rl:${config.key}:${hashKey(apiKeyValue)}`;

  try {
    const multi = redis.multi();
    multi.incr(key);
    multi.ttl(key);
    const results = await multi.exec();

    if (!results) {
      return { allowed: true, remaining: config.maxRequests, reset: 0 };
    }

    const count = (results[0]?.[1] as number) ?? 1;
    let ttl = (results[1]?.[1] as number) ?? config.windowSeconds;

    if (count === 1) {
      await redis.expire(key, config.windowSeconds);
      ttl = config.windowSeconds;
    }

    const remaining = Math.max(0, config.maxRequests - count);
    const allowed = count <= config.maxRequests;

    return { allowed, remaining, reset: Math.ceil(Date.now() / 1000) + ttl };
  } catch {
    return { allowed: true, remaining: config.maxRequests, reset: 0 };
  }
}

function hashKey(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function extractApiKey(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  const xApiKey = request.headers.get("x-api-key");
  if (xApiKey) return xApiKey;
  return null;
}
