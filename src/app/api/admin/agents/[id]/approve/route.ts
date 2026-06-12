import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !["ADMIN", "MODERATOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const agent = await prisma.agent.findUnique({ where: { id } });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }
  if (agent.status !== "PENDING") {
    return NextResponse.json({ error: "Agent is not in PENDING status" }, { status: 400 });
  }

  await prisma.agent.update({
    where: { id },
    data: { status: "APPROVED" },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "AGENT_APPROVED",
      targetType: "agent",
      targetId: id,
    },
  });

  return NextResponse.json({ ok: true, status: "APPROVED" });
}
