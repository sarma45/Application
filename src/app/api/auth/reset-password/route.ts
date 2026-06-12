import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { logger } from "@/lib/logger";
import { z } from "zod";

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { token, password } = parsed.data;

    const resetRecord = await prisma.passwordReset.findUnique({ where: { token } });
    if (!resetRecord) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    if (resetRecord.usedAt) {
      return NextResponse.json({ error: "Token already used" }, { status: 400 });
    }

    if (new Date() > resetRecord.expiresAt) {
      return NextResponse.json({ error: "Token expired" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetRecord.userId },
        data: { password: hashedPassword },
      });
      await tx.passwordReset.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      });
    });

    logger.info("Password reset completed", { userId: resetRecord.userId });

    return NextResponse.json({ ok: true, message: "Password reset successfully" });
  } catch (error) {
    logger.error("Reset password error", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
