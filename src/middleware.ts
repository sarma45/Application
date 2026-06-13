import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const authPaths = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
];

const csrfSafeMethods = ["GET", "HEAD", "OPTIONS"];
const webhookPaths = ["/api/webhooks/stripe", "/api/webhooks/razorpay"];

async function getRedisClient() {
  try {
    const { redis } = await import("@/lib/redis");
    return redis && redis.status === "ready" ? redis : null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const isWebhook = webhookPaths.some(p => pathname.startsWith(p));

    if (!isWebhook && !csrfSafeMethods.includes(request.method)) {
      const origin = request.headers.get("origin");
      const referer = request.headers.get("referer");
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const allowedOrigins = [appUrl, appUrl.replace(/\/$/, "")];

      if (origin) {
        const isAllowed = allowedOrigins.some((a) => origin.startsWith(a));
        if (!isAllowed) {
          return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
        }
      } else if (referer) {
        const isAllowed = allowedOrigins.some((a) => referer.startsWith(a));
        if (!isAllowed) {
          return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
        }
      }
    }

    // Rate limiting
    const ip = request.headers.get("x-real-ip")
      || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || "unknown";

    const zone = authPaths.some(p => pathname.startsWith(p)) ? "auth" : "api";
    const windowSeconds = zone === "auth" ? 300 : 60;
    const maxReqs = zone === "auth" ? 10 : 100;
    const key = `rl:${zone}:${ip}`;

    const redis = await getRedisClient();
    if (redis) {
      try {
        const multi = redis.multi();
        multi.incr(key);
        multi.ttl(key);
        const results = await multi.exec();
        if (results) {
          const count = (results[0]?.[1] as number) ?? 1;
          let ttl = (results[1]?.[1] as number) ?? windowSeconds;
          if (count === 1) {
            await redis.expire(key, windowSeconds);
            ttl = windowSeconds;
          }
          if (count > maxReqs) {
            return NextResponse.json(
              { error: "Too many requests. Please slow down." },
              { status: 429, headers: { "Retry-After": String(windowSeconds) } }
            );
          }
          const remaining = Math.max(0, maxReqs - count);
          const response = NextResponse.next();
          response.headers.set("X-RateLimit-Remaining", String(remaining));
          return response;
        }
      } catch {
        // fall through to in-memory fallback
      }
    }

    // In-memory fallback if Redis is unavailable
    const g = globalThis as { __rateLimits?: Map<string, { count: number; reset: number }> };
    const rateLimits = g.__rateLimits ?? new Map<string, { count: number; reset: number }>();
    g.__rateLimits = rateLimits;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    // Cleanup expired entries every 100 requests
    if (rateLimits.size > 1000) {
      const cutoff = now - 60000;
      for (const [k, v] of rateLimits) {
        if (v.reset < cutoff) rateLimits.delete(k);
      }
    }

    const record = rateLimits.get(key);

    if (record && now < record.reset) {
      record.count++;
      if (record.count > maxReqs) {
        return NextResponse.json(
          { error: "Too many requests. Please slow down." },
          { status: 429, headers: { "Retry-After": String(windowSeconds) } }
        );
      }
    } else {
      rateLimits.set(key, { count: 1, reset: now + windowMs });
    }

    const remaining = maxReqs - (rateLimits.get(key)?.count ?? 0);
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Remaining", String(Math.max(0, remaining)));
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
