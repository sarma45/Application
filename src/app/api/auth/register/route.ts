import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const username = body.username ? String(body.username).trim() : null;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const db = await prisma;
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    if (!hashedPassword) {
      return NextResponse.json({ error: "Password hashing failed" }, { status: 500 });
    }

    const user = await db.user.create({
      data: { email, username, password: hashedPassword, role: "USER", plan: "FREE" },
      select: { id: true, email: true, username: true, role: true, plan: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (error) {
    console.error("Register error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function hashPassword(password: string): Promise<string> {
  const nodeCrypto = await import("node:crypto");
  return nodeCrypto.createHash("sha256").update(password).digest("hex");
}
