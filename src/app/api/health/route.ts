import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export const runtime = "nodejs";

export async function GET() {
  const services: Record<string, unknown> = {};
  let status: string = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
    services.database = { status: "healthy" };
  } catch (error) {
    services.database = { status: "unhealthy", error: String(error) };
    status = "degraded";
  }

  try {
    if (redis && redis.status === "ready") {
      await redis.ping();
      services.redis = { status: "healthy" };
    } else {
      services.redis = { status: "unavailable" };
    }
  } catch (error) {
    services.redis = { status: "unhealthy", error: String(error) };
    status = "degraded";
  }

  const health = { status, timestamp: new Date().toISOString(), version: "2.0.0", services };

  const statusCode = health.status === "ok" ? 200 : 503;
  return NextResponse.json(health, { status: statusCode });
}
