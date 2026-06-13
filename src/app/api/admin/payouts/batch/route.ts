import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { enqueuePayoutBatch } from "@/lib/queue";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const pendingCount = await prisma.creatorPayout.count({ where: { status: "PENDING" } });

    if (pendingCount === 0) {
      return NextResponse.json({ ok: true, message: "No pending payouts to process" });
    }

    await enqueuePayoutBatch();

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "PAYOUT_BATCH_TRIGGERED",
        targetType: "System",
        metadata: JSON.stringify({ pendingCount }),
      },
    });

    logger.info("Payout batch triggered by admin", {
      adminId: session.user.id,
      pendingCount,
    });

    return NextResponse.json({ ok: true, pendingCount, message: "Payout batch processing started" });
  } catch (error) {
    logger.error("Payout batch trigger error", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}