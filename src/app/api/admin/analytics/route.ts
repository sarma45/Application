import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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
    mrr,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.agent.count(),
    prisma.user.count({ where: { isActive: true, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.agent.count({ where: { status: "PENDING" } }),
    prisma.agentExecution.count(),
    prisma.agentExecution.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.payment.aggregate({ _sum: { amountUsd: true }, where: { status: "completed" } }),
    prisma.subscription.count({ where: { status: "active" } }),
  ]);

  const executionsByDay = await prisma.agentExecution.groupBy({
    by: ["createdAt"],
    _count: { id: true },
    where: { createdAt: { gte: thirtyDaysAgo } },
  });

  const registrationsByDay = await prisma.user.groupBy({
    by: ["createdAt"],
    _count: { id: true },
    where: { createdAt: { gte: thirtyDaysAgo } },
  });

  return NextResponse.json({
    metrics: {
      totalUsers,
      totalAgents,
      activeUsers,
      pendingAgents,
      totalExecutions,
      recentExecutions,
      totalRevenue: totalRevenue._sum.amountUsd || 0,
      mrr: (mrr || 0) * 19,
    },
    charts: {
      executionsByDay: executionsByDay.map((e) => ({ date: e.createdAt, count: e._count.id })),
      registrationsByDay: registrationsByDay.map((e) => ({ date: e.createdAt, count: e._count.id })),
    },
  });
}
