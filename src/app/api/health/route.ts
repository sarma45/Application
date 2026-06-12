import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export const runtime = "nodejs";

export async function GET() {
  const checks: Record<string, string> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  try {
    if (redis && redis.status === "ready") {
      await redis.ping();
      checks.redis = "ok";
    } else {
      checks.redis = "unavailable";
    }
  } catch {
    checks.redis = "error";
  }

  const allOk = Object.values(checks).every((s) => s === "ok" || s === "unavailable");

  return NextResponse.json(
    { ok: allOk, ts: Date.now(), checks },
    { status: allOk ? 200 : 503 }
  );
}
