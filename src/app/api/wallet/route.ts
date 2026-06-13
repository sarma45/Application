import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet, cacheDel, CACHE_TTL } from "@/lib/redis";
import { walletCreditSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = walletCreditSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { amount, description } = parsed.data;
    const targetUserId = body.userId || session.user.id;

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });
    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.wallet.upsert({
        where: { userId: targetUserId },
        update: {},
        create: { userId: targetUserId, balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 },
      });

      const updatedWallet = await tx.wallet.update({
        where: { userId: targetUserId },
        data: {
          balance: { increment: amount },
          ...(amount > 0 ? { lifetimeSpent: { increment: amount } } : { lifetimeEarned: { increment: Math.abs(amount) } }),
        },
      });

      await tx.transaction.create({
        data: {
          userId: targetUserId,
          type: amount >= 0 ? "PURCHASE" : "REFUND",
          amount: Math.abs(amount),
          balanceAfter: updatedWallet.balance,
          referenceType: "AdminAdjustment",
          referenceId: description || null,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: amount >= 0 ? "CREDIT_ADJUST" : "DEBIT_ADJUST",
          targetType: "wallet",
          targetId: targetUserId,
          metadata: JSON.stringify({ amount, description }),
        },
      });

      return updatedWallet;
    });

    await cacheDel(`wallet:${targetUserId}`);

    return NextResponse.json({ ok: true, balance: updated.balance, targetUserId });
  } catch (error) {
    logger.error("wallet error", { error: String(error), userId: session.user.id });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cacheKey = `wallet:${session.user.id}`;
  let wallet = await cacheGet<any>(cacheKey);
  if (!wallet) {
    wallet = await prisma.wallet.upsert({
      where: { userId: session.user.id },
      update: {},
      create: { userId: session.user.id, balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 },
      include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } },
    });
    await cacheSet(cacheKey, wallet ?? null, CACHE_TTL.WALLET);
  }

  return NextResponse.json({ wallet });
}
