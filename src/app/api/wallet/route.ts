import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet, cacheDel, CACHE_TTL } from "@/lib/redis";
import { walletCreditSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = walletCreditSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { amount, description } = parsed.data;

    const wallet = await prisma.wallet.upsert({
      where: { userId: session.user.id },
      update: {},
      create: { userId: session.user.id, balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 },
    });

    const updated = await prisma.$transaction(async (tx) => {
      const w = await tx.wallet.update({
        where: { userId: session.user.id },
        data: { balance: wallet.balance + amount, lifetimeSpent: wallet.lifetimeSpent },
      });

      await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: "PURCHASE",
          amount,
          balanceAfter: w.balance,
          referenceType: "Payment",
          referenceId: description || null,
        },
      });

      return w;
    });

    await cacheDel(`wallet:${session.user.id}`);

    return NextResponse.json({ ok: true, balance: updated.balance });
  } catch (error) {
    console.error("wallet error", error);
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
    wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
      include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } },
    });
    await cacheSet(cacheKey, wallet, CACHE_TTL.WALLET);
  }

  return NextResponse.json({ wallet });
}
