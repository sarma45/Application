import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { cacheDel } from "@/lib/redis";

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

  const updated = await prisma.agent.update({
    where: { id },
    data: { isFeatured: !agent.isFeatured },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: updated.isFeatured ? "AGENT_FEATURED" : "AGENT_UNFEATURED",
      targetType: "agent",
      targetId: id,
    },
  });

  await cacheDel("home:featured");

  return NextResponse.json({ ok: true, isFeatured: updated.isFeatured });
}
