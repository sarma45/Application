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

  try {
    const body = await req.json();
    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const agent = await prisma.agent.findUnique({ where: { slug } });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (agent.creatorId === session.user.id) {
      return NextResponse.json({ error: "Cannot review your own agent" }, { status: 403 });
    }

    const review = await prisma.agentReview.upsert({
      where: { agentId_userId: { agentId: agent.id, userId: session.user.id } },
      update: { rating: parsed.data.rating, title: parsed.data.title, body: parsed.data.body },
      create: {
        agentId: agent.id,
        userId: session.user.id,
        rating: parsed.data.rating,
        title: parsed.data.title,
        body: parsed.data.body,
      },
    });

    const avg = await prisma.agentReview.aggregate({
      where: { agentId: agent.id },
      _avg: { rating: true },
    });

    await prisma.agent.update({
      where: { id: agent.id },
      data: { avgRating: avg._avg.rating },
    });

    return NextResponse.json({ ok: true, review }, { status: 201 });
  } catch (error) {
    console.error("review error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
