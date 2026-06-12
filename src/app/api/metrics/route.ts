import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export const runtime = "nodejs";

export async function GET() {
  const metrics: string[] = [];

  metrics.push("# HELP aiverse_up Whether the service is up");
  metrics.push("# TYPE aiverse_up gauge");
  metrics.push("aiverse_up 1");

  try {
    const userCount = await prisma.user.count();
    metrics.push("# HELP aiverse_users_total Total registered users");
    metrics.push("# TYPE aiverse_users_total gauge");
    metrics.push(`aiverse_users_total ${userCount}`);
  } catch { /* db down */ }

  try {
    const agentCount = await prisma.agent.count({ where: { status: "APPROVED" } });
    metrics.push("# HELP aiverse_agents_approved_total Total approved agents");
    metrics.push("# TYPE aiverse_agents_approved_total gauge");
    metrics.push(`aiverse_agents_approved_total ${agentCount}`);
  } catch { /* db down */ }

  try {
    const executionCount = await prisma.agentExecution.count();
    metrics.push("# HELP aiverse_executions_total Total agent executions");
    metrics.push("# TYPE aiverse_executions_total gauge");
    metrics.push(`aiverse_executions_total ${executionCount}`);
  } catch { /* db down */ }

  try {
    const revenue = await prisma.wallet.aggregate({ _sum: { lifetimeSpent: true } });
    const mrr = Number(revenue._sum.lifetimeSpent || 0) * 0.001;
    metrics.push("# HELP aiverse_mrr_usd Monthly recurring revenue in USD");
    metrics.push("# TYPE aiverse_mrr_usd gauge");
    metrics.push(`aiverse_mrr_usd ${mrr.toFixed(2)}`);
  } catch { /* db down */ }

  if (redis) {
    try {
      const redisPing = await redis.ping();
      metrics.push("# HELP aiverse_redis_up Whether Redis is reachable");
      metrics.push("# TYPE aiverse_redis_up gauge");
      metrics.push(`aiverse_redis_up ${redisPing === "PONG" ? 1 : 0}`);
    } catch {
      metrics.push("aiverse_redis_up 0");
    }
  } else {
    metrics.push("aiverse_redis_up 0");
  }

  const mem = process.memoryUsage();
  metrics.push("# HELP aiverse_node_memory_bytes Node.js memory usage in bytes");
  metrics.push("# TYPE aiverse_node_memory_bytes gauge");
  metrics.push(`aiverse_node_memory_bytes ${mem.heapUsed}`);

  return new NextResponse(metrics.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
