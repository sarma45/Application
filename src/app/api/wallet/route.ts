import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { amount, description } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

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

    return NextResponse.json({ ok: true, balance: updated.balance });
  } catch (error) {
    console.error("wallet error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wallet = await prisma.wallet.findUnique({
    where: { userId: session.user.id },
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } },
  });

  return NextResponse.json({ wallet });
}
