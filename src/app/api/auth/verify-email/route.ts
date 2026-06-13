import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    await prisma.emailVerification.deleteMany({ where: { expiresAt: { lt: new Date() } } });

    const verification = await prisma.emailVerification.findUnique({ where: { token } });
    if (!verification || verification.verifiedAt || new Date() > verification.expiresAt) {
      return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: verification.userId },
        data: { isActive: true },
      });
      await tx.emailVerification.update({
        where: { id: verification.id },
        data: { verifiedAt: new Date() },
      });
    });

    await prisma.wallet.upsert({
      where: { userId: verification.userId },
      update: {},
      create: {
        userId: verification.userId,
        balance: 100,
        lifetimeEarned: 100,
        lifetimeSpent: 0,
      },
    });

    logger.info("Email verified", { userId: verification.userId });

    return NextResponse.json({ ok: true, message: "Email verified successfully" });
  } catch (error) {
    logger.error("Verify email error", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
