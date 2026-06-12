import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 100);

  const agent = await prisma.agent.findUnique({ where: { slug } });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  if (agent.creatorId !== session.user.id && !["ADMIN", "MODERATOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const executions = await prisma.agentExecution.findMany({
    where: { agentId: agent.id },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = executions.length > limit;
  const items = hasMore ? executions.slice(0, limit) : executions;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return NextResponse.json({
    data: items,
    nextCursor,
    total: await prisma.agentExecution.count({ where: { agentId: agent.id } }),
  });
}
