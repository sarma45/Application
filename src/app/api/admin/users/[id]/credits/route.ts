import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { z } from "zod";

const adjustSchema = z.object({
  amount: z.number().int(),
  description: z.string().max(500).optional(),
});

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = adjustSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { amount, description } = parsed.data;

    const wallet = await prisma.wallet.upsert({
      where: { userId: id },
      update: {},
      create: { userId: id, balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 },
    });

    const updated = await prisma.wallet.update({
      where: { userId: id },
      data: {
        balance: Number(wallet.balance) + amount,
        ...(amount > 0
          ? { lifetimeEarned: Number(wallet.lifetimeEarned) + amount }
          : { lifetimeSpent: Number(wallet.lifetimeSpent) + Math.abs(amount) }),
      },
    });

    await prisma.transaction.create({
      data: {
        userId: id,
        type: amount > 0 ? "BONUS" : "SPEND",
        amount: Math.abs(amount),
        balanceAfter: updated.balance,
        referenceType: "AdminAdjustment",
        referenceId: session.user.id,
        description: description || `Admin ${amount > 0 ? "credit" : "debit"} adjustment`,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "admin_credit_adjustment",
        targetType: "User",
        targetId: id,
        metadata: JSON.stringify({ amount, description }),
      },
    });

    logger.info("Admin credit adjustment", {
      adminId: session.user.id,
      targetUserId: id,
      amount,
    });

    return NextResponse.json({ ok: true, balance: updated.balance });
  } catch (error) {
    logger.error("Admin credit adjustment error", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
