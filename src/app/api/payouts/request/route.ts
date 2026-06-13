import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const PAYOUT_THRESHOLD_USD = 10;

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { amountUsd } = await req.json();

    if (!amountUsd || amountUsd < PAYOUT_THRESHOLD_USD) {
      return NextResponse.json(
        { error: `Minimum payout is $${PAYOUT_THRESHOLD_USD}` },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { createdAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const daysSinceCreation = Math.floor((Date.now() - user.createdAt.getTime()) / 86400000);
    const firstPayoutHoldDays = 30;

    const existingPayouts = await prisma.creatorPayout.findFirst({
      where: { creatorId: session.user.id, status: "COMPLETED" },
    });

    if (!existingPayouts && daysSinceCreation < firstPayoutHoldDays) {
      return NextResponse.json(
        { error: `First payout requires ${firstPayoutHoldDays} days account age. You have ${daysSinceCreation} day(s).` },
        { status: 400 }
      );
    }

    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!creatorProfile?.payoutMethod) {
      return NextResponse.json(
        { error: "No payout method configured. Add one in your creator profile." },
        { status: 400 }
      );
    }

    const creditsNeeded = Math.ceil(amountUsd * 100);
    const wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id } });

    if (!wallet || wallet.lifetimeEarned < creditsNeeded || wallet.balance < creditsNeeded) {
      return NextResponse.json(
        { error: "Insufficient earned credits for this payout amount" },
        { status: 400 }
      );
    }

    const payout = await prisma.$transaction(async (tx) => {
      const currentWallet = await tx.wallet.findUnique({
        where: { userId: session.user.id },
        select: { balance: true, lifetimeEarned: true },
      });

      if (!currentWallet || currentWallet.lifetimeEarned < creditsNeeded || currentWallet.balance < creditsNeeded) {
        throw new Error("Insufficient earned credits for this payout amount");
      }

      await tx.wallet.update({
        where: { userId: session.user.id },
        data: { balance: { decrement: creditsNeeded }, lifetimeEarned: { decrement: creditsNeeded } },
      });

      return tx.creatorPayout.create({
        data: {
          creatorId: session.user.id,
          amountUsd,
          creditsRedeemed: creditsNeeded,
          status: "PENDING",
          payoutMethod: creatorProfile.payoutMethod,
        },
      });
    });

    logger.info("Payout requested", {
      userId: session.user.id,
      amountUsd,
      payoutId: payout.id,
    });

    return NextResponse.json({ ok: true, payout }, { status: 201 });
  } catch (error) {
    logger.error("Payout request error", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
