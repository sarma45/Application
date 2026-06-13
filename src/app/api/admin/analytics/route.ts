import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const PLAN_MONTHLY_PRICES: Record<string, number> = {
  FREE: 0,
  PRO: 19,
  CREATOR: 39,
  BUSINESS: 99,
  ENTERPRISE: 499,
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !["ADMIN", "MODERATOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalAgents,
    activeUsers,
    pendingAgents,
    totalExecutions,
    recentExecutions,
    totalRevenue,
    activeSubscriptions,
    executionDayBuckets,
    registrationDayBuckets,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.agent.count(),
    prisma.user.count({ where: { isActive: true, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.agent.count({ where: { status: "PENDING" } }),
    prisma.agentExecution.count(),
    prisma.agentExecution.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.payment.aggregate({ _sum: { amountUsd: true }, where: { status: "COMPLETED" } }),
    prisma.subscription.findMany({ where: { status: "active" }, select: { plan: true } }),
    prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE(created_at) as date, COUNT(*)::int as count
      FROM "AgentExecution"
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
    prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE(created_at) as date, COUNT(*)::int as count
      FROM "User"
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
  ]);

  const mrr = activeSubscriptions.reduce((sum, sub) => sum + (PLAN_MONTHLY_PRICES[sub.plan] || 0), 0);

  return NextResponse.json({
    metrics: {
      totalUsers,
      totalAgents,
      activeUsers,
      pendingAgents,
      totalExecutions,
      recentExecutions,
      totalRevenue: totalRevenue._sum.amountUsd || 0,
      mrr,
    },
    charts: {
      executionsByDay: executionDayBuckets.map((e) => ({ date: e.date, count: Number(e.count) })),
      registrationsByDay: registrationDayBuckets.map((e) => ({ date: e.date, count: Number(e.count) })),
    },
  });
}
