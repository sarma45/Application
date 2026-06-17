import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { createReviewSchema } from "@/lib/validations";
import { unauthorized, badRequest, notFound, serverError } from "@/lib/api-helpers";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  try {
    const body = await req.json();
    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten().fieldErrors);

    const agent = await prisma.agent.findUnique({ where: { id } });
    if (!agent) return notFound("Agent not found");

    const review = await prisma.agentReview.create({
      data: {
        agentId: id,
        userId: session.user.id,
        rating: parsed.data.rating,
        title: parsed.data.title,
        body: parsed.data.body,
      },
    });

    const ratings = await prisma.agentReview.aggregate({
      where: { agentId: id },
      _avg: { rating: true },
    });

    await prisma.agent.update({
      where: { id },
      data: { avgRating: ratings._avg.rating },
    });

    return NextResponse.json({ ok: true, review }, { status: 201 });
  } catch (error) {
    console.error("create review error", error);
    return serverError();
  }
}
