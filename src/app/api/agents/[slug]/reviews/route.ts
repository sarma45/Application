import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { createReviewSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const agent = await prisma.agent.findUnique({ where: { slug } });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  if (agent.creatorId === session.user.id) {
    return NextResponse.json({ error: "Cannot review your own agent" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const existing = await prisma.agentReview.findUnique({
      where: { agentId_userId: { agentId: agent.id, userId: session.user.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "You have already reviewed this agent" }, { status: 409 });
    }

    const review = await prisma.$transaction(async (tx) => {
      const r = await tx.agentReview.create({
        data: {
          agentId: agent.id,
          userId: session.user.id,
          rating: parsed.data.rating,
          title: parsed.data.title || null,
          body: parsed.data.body || null,
        },
      });

      const aggregate = await tx.agentReview.aggregate({
        where: { agentId: agent.id },
        _avg: { rating: true },
      });

      await tx.agent.update({
        where: { id: agent.id },
        data: { avgRating: aggregate._avg.rating },
      });

      return r;
    });

    return NextResponse.json({ ok: true, review }, { status: 201 });
  } catch (error) {
    console.error("create review error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
