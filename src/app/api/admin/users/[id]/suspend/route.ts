import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, isActive: true, role: true } });
    if (!user) {
      return NextResponse.json({ error: "User not found", code: "NOT_FOUND" }, { status: 404 });
    }
    if (user.role === "ADMIN") {
      return NextResponse.json({ error: "Cannot suspend another admin", code: "BAD_REQUEST" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, email: true, isActive: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: updated.isActive ? "user_unsuspended" : "user_suspended",
        targetType: "User",
        targetId: id,
        metadata: JSON.stringify({ previousStatus: user.isActive }),
      },
    });

    logger.info(`User ${updated.isActive ? "unsuspended" : "suspended"}`, {
      adminId: session.user.id,
      targetUserId: id,
    });

    return NextResponse.json({ ok: true, user: updated });
  } catch (error) {
    logger.error("Admin suspend error", { error: String(error) });
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}