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
      await tx.wallet.update({
        where: { userId: session.user.id },
        data: { balance: { decrement: creditsNeeded }, lifetimeEarned: wallet.lifetimeEarned - creditsNeeded },
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
