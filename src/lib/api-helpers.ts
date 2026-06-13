import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

export interface ApiError {
  error: string;
  code: string;
  details?: unknown;
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

export function created<T>(data: T) {
  return NextResponse.json({ ok: true, ...data }, { status: 201 });
}

export function apiError(error: string, code: string, status: number, details?: unknown) {
  const body: ApiError = { error, code };
  if (details) body.details = details;
  return NextResponse.json(body, { status });
}

export function badRequest(error: string, details?: unknown) {
  return apiError(error, "BAD_REQUEST", 400, details);
}

export function unauthorized(error = "Unauthorized") {
  return apiError(error, "UNAUTHORIZED", 401);
}

export function forbidden(error = "Forbidden") {
  return apiError(error, "FORBIDDEN", 403);
}

export function notFound(error = "Not found") {
  return apiError(error, "NOT_FOUND", 404);
}

export function conflict(error: string) {
  return apiError(error, "CONFLICT", 409);
}

export function tooMany(error = "Too many requests") {
  return apiError(error, "RATE_LIMITED", 429);
}

export function serverError(error = "Internal server error") {
  return apiError(error, "INTERNAL_ERROR", 500);
}

export function paymentRequired(error = "Payment required") {
  return apiError(error, "PAYMENT_REQUIRED", 402);
}

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { session: null, error: unauthorized() } as const;
  }
  return { session, error: null } as const;
}

interface HandlerContext {
  req: Request;
  params?: Record<string, string>;
}

export type ApiHandler = (_ctx: HandlerContext) => Promise<NextResponse>;

export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (ctx: HandlerContext) => {
    try {
      return await handler(ctx);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal server error";
      logger.error("API handler error", {
        error: message,
        url: ctx.req.url,
        method: ctx.req.method,
      });
      return serverError(message);
    }
  };
}

export function withRateLimit(zone: "auth" | "api" | "execute" = "api", handler: ApiHandler): ApiHandler {
  return async (ctx: HandlerContext) => {
    const rl = await rateLimit(ctx.req, zone);
    if (!rl.allowed) {
      return tooMany("Too many requests. Please slow down.");
    }
    const response = await handler(ctx);
    if (response.headers) {
      response.headers.set("X-RateLimit-Remaining", String(rl.remaining));
      response.headers.set("X-RateLimit-Reset", String(rl.reset));
    }
    return response;
  };
}
