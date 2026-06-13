import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import crypto from "crypto";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const referrals = await prisma.referral.findMany({
    where: { referrerId: session.user.id },
    include: { referee: { select: { email: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
  });

  const referralCode = referrals[0]?.code || null;

  return NextResponse.json({ data: referrals, referralCode });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existing = await prisma.referral.findFirst({
      where: { referrerId: session.user.id },
    });

    if (existing) {
      return NextResponse.json({ code: existing.code }, { status: 200 });
    }

    const code = crypto.randomBytes(4).toString("hex");

    const referral = await prisma.referral.create({
      data: {
        referrerId: session.user.id,
        code,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ code: referral.code }, { status: 201 });
  } catch (error) {
    logger.error("Referral creation error", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Referral code is required" }, { status: 400 });
    }

    const referral = await prisma.referral.findUnique({ where: { code } });
    if (!referral) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    }

    if (referral.refereeId === session.user.id) {
      return NextResponse.json({ error: "Cannot use your own referral code" }, { status: 400 });
    }

    if (referral.referrerId === session.user.id) {
      return NextResponse.json({ error: "Cannot use your own referral code" }, { status: 400 });
    }

    const REFERRAL_BONUS = 50;

    await prisma.$transaction(async (tx) => {
      const updated = await tx.referral.updateMany({
        where: { id: referral.id, status: "PENDING" },
        data: { refereeId: session.user.id, status: "COMPLETED", rewardGiven: REFERRAL_BONUS },
      });

      if (updated.count === 0) {
        throw new Error("Referral code already used");
      }

      await tx.wallet.upsert({
        where: { userId: referral.referrerId },
        update: { balance: { increment: REFERRAL_BONUS }, lifetimeEarned: { increment: REFERRAL_BONUS } },
        create: { userId: referral.referrerId, balance: REFERRAL_BONUS, lifetimeEarned: REFERRAL_BONUS, lifetimeSpent: 0 },
      });

      await tx.wallet.upsert({
        where: { userId: session.user.id },
        update: { balance: { increment: REFERRAL_BONUS }, lifetimeEarned: { increment: REFERRAL_BONUS } },
        create: { userId: session.user.id, balance: REFERRAL_BONUS, lifetimeEarned: REFERRAL_BONUS, lifetimeSpent: 0 },
      });

      const refWallet = await tx.wallet.findUnique({
        where: { userId: referral.referrerId },
        select: { balance: true },
      });

      const refWallet2 = await tx.wallet.findUnique({
        where: { userId: session.user.id },
        select: { balance: true },
      });

      await tx.transaction.create({
        data: {
          userId: referral.referrerId,
          type: "BONUS",
          amount: REFERRAL_BONUS,
          balanceAfter: (refWallet?.balance ?? 0),
          referenceType: "Referral",
          referenceId: referral.id,
        },
      });

      await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: "BONUS",
          amount: REFERRAL_BONUS,
          balanceAfter: (refWallet2?.balance ?? 0),
          referenceType: "Referral",
          referenceId: referral.id,
        },
      });
    });

    logger.info("Referral code redeemed", {
      referrerId: referral.referrerId,
      refereeId: session.user.id,
    });

    return NextResponse.json({ ok: true, message: `Referral code applied! You and the referrer each got ${REFERRAL_BONUS} bonus credits.` });
  } catch (error) {
    logger.error("Referral redeem error", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
