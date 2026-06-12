import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existing = await prisma.emailVerification.findFirst({
      where: { userId: session.user.id, verifiedAt: null, expiresAt: { gt: new Date() } },
    });

    if (existing) {
      return NextResponse.json({ error: "Verification email already sent" }, { status: 429 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.emailVerification.create({
      data: {
        userId: session.user.id,
        token,
        expiresAt,
      },
    });

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email?token=${token}`;

    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "noreply@aiverse.ai",
          to: session.user.email!,
          subject: "Verify your AIVerse email",
          html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email. This link expires in 24 hours.</p>`,
        });
      } catch (emailError) {
        logger.warn("Failed to send verification email", { error: String(emailError) });
      }
    }

    logger.info("Verification email sent", { userId: session.user.id });

    return NextResponse.json({ ok: true, message: "Verification email sent" });
  } catch (error) {
    logger.error("Send verification error", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
