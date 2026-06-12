import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 100);

  const agent = await prisma.agent.findUnique({ where: { slug } });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const reviews = await prisma.agentReview.findMany({
    where: { agentId: agent.id },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    include: {
      user: { select: { username: true, id: true } },
    },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = reviews.length > limit;
  const items = hasMore ? reviews.slice(0, limit) : reviews;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return NextResponse.json({ data: items, nextCursor });
}
