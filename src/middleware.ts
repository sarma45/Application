import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { redis } from "@/lib/redis";

const authPaths = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
];

const csrfSafeMethods = ["GET", "HEAD", "OPTIONS"];
const webhookPaths = ["/api/webhooks/stripe", "/api/webhooks/razorpay"];

const g = globalThis as { __rateLimits?: Map<string, { count: number; reset: number }> };
const rateLimits = g.__rateLimits ?? new Map<string, { count: number; reset: number }>();
g.__rateLimits = rateLimits;

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

    const ip = request.headers.get("x-real-ip")
      || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || "unknown";

    const apiKey = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace("Bearer ", "");

    const zone = authPaths.some(p => pathname.startsWith(p)) ? "auth" : "api";
    const windowSeconds = zone === "auth" ? 300 : 60;
    const maxReqs = zone === "auth" ? 10 : (apiKey ? 1000 : 100);
    const key = `rl:${zone}:${apiKey || ip}`;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    let count = 0;
    let resetTime = now + windowMs;
    let usedRedis = false;

    if (redis) {
      try {
        const currentCount = await redis.incr(key);
        if (currentCount === 1) {
          await redis.expire(key, windowSeconds);
        }
        count = currentCount;
        const ttl = await redis.ttl(key);
        resetTime = now + (ttl > 0 ? ttl * 1000 : windowMs);
        usedRedis = true;
      } catch (err) {
        console.warn("Redis rate limiting failed, falling back to memory limit:", err);
      }
    }

    if (!usedRedis) {
      // Prune expired entries if the map grows
      if (rateLimits.size > 1000) {
        const cutoff = now;
        for (const [k, v] of rateLimits) {
          if (v.reset < cutoff) rateLimits.delete(k);
        }
      }

      // Bound map size to prevent memory leak
      if (rateLimits.size > 2000) {
        const keysArray = Array.from(rateLimits.keys());
        for (let i = 0; i < 500; i++) {
          rateLimits.delete(keysArray[i]);
        }
      }

      const record = rateLimits.get(key);

      if (record && now < record.reset) {
        record.count++;
        count = record.count;
        resetTime = record.reset;
      } else {
        rateLimits.set(key, { count: 1, reset: now + windowMs });
        count = 1;
        resetTime = now + windowMs;
      }
    }

    if (count > maxReqs) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((resetTime - now) / 1000)), "X-RateLimit-Key": apiKey ? "api-key" : "ip" } }
      );
    }

    const remaining = maxReqs - count;
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Remaining", String(Math.max(0, remaining)));
    response.headers.set("X-RateLimit-Limit", String(maxReqs));
    if (apiKey) {
      response.headers.set("X-RateLimit-Scope", "api-key");
    }
    return response;
  }

  if (pathname.startsWith("/ws/")) {
    const response = NextResponse.next();
    response.headers.set("Upgrade", "websocket");
    response.headers.set("Connection", "upgrade");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/ws/:path*"],
};
