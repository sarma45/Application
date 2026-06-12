import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const agent = await prisma.agent.findUnique({ where: { slug } });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (agent.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (agent.status !== "DRAFT") {
      return NextResponse.json({ error: "Agent is not in DRAFT status" }, { status: 400 });
    }

    const updated = await prisma.agent.update({
      where: { id: agent.id },
      data: { status: "PENDING" },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "agent_submitted_for_review",
        targetType: "Agent",
        targetId: agent.id,
      },
    });

    logger.info("Agent submitted for moderation", {
      agentId: agent.id,
      agentName: agent.name,
      creatorId: session.user.id,
    });

    return NextResponse.json({ ok: true, agent: updated });
  } catch (error) {
    logger.error("Publish agent error", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
