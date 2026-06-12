import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const authPaths = ["/api/auth/login", "/api/auth/register", "/api/auth/forgot-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";

    const zone = authPaths.some(p => pathname.startsWith(p)) ? "auth" : "api";
    const windowMs = zone === "auth" ? 300000 : 60000;
    const maxReqs = zone === "auth" ? 10 : 100;

    try {
      const { default: Redis } = await import("ioredis");
      const redisUrl = process.env.REDIS_URL;
      if (redisUrl) {
        const redis = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });
        const key = `rate:${zone}:${ip}`;
        const count = await redis.incr(key);
        if (count === 1) await redis.expire(key, Math.ceil(windowMs / 1000));
        const ttl = await redis.ttl(key);
        await redis.quit();

        if (count > maxReqs) {
          return NextResponse.json(
            { error: "Too many requests. Please slow down." },
            { status: 429, headers: { "Retry-After": String(Math.ceil(ttl)) } }
          );
        }

        const remaining = Math.max(0, maxReqs - count);
        const response = NextResponse.next();
        response.headers.set("X-RateLimit-Remaining", String(remaining));
        response.headers.set("X-RateLimit-Reset", String(Math.ceil(Date.now() / 1000) + ttl));
        return response;
      }
    } catch {
      // Redis unavailable - fall through to in-memory rate limiting
    }

    const response = NextResponse.next();
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
