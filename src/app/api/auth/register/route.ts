import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, password, username } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, username, password: hashedPassword, role: "USER", plan: "FREE", isActive: false },
      select: { id: true, email: true, username: true, role: true, plan: true, createdAt: true },
    });

    const verificationToken = crypto.randomBytes(32).toString("hex");
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: email,
      subject: "Verify your AIVerse account",
      html: `<p>Welcome to AIVerse! Click <a href="${verifyUrl}">here</a> to verify your email.<br/><br/>You'll receive 100 free credits once verified.</p>`,
    });

    logger.info("User registered", { userId: user.id, email });

    return NextResponse.json({
      ok: true,
      user,
      message: "Account created. Please check your email to verify your account.",
    }, { status: 201 });
  } catch (error) {
    logger.error("Register error", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
