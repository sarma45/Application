import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const authPaths = ["/api/auth/login", "/api/auth/register", "/api/auth/forgot-password"];

const rateLimits = new Map<string, { count: number; reset: number }>();

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";

    const zone = authPaths.some(p => pathname.startsWith(p)) ? "auth" : "api";
    const windowMs = zone === "auth" ? 300000 : 60000;
    const maxReqs = zone === "auth" ? 10 : 100;
    const key = `${zone}:${ip}`;

    const now = Date.now();
    const record = rateLimits.get(key);

    if (record && now < record.reset) {
      record.count++;
      if (record.count > maxReqs) {
        return NextResponse.json(
          { error: "Too many requests. Please slow down." },
          { status: 429, headers: { "Retry-After": "60" } }
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
