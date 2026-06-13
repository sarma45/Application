import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

export const runtime = "nodejs";

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.enum(["agents:read", "agents:write", "agents:execute", "wallet:read", "chat", "admin"])).min(1),
});

function generateApiKey(): string {
  return `av_${crypto.randomBytes(32).toString("hex")}`;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, scopes: true, lastUsedAt: true, expiresAt: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ keys });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createKeySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, scopes } = parsed.data;
    const key = generateApiKey();

    const apiKey = await prisma.apiKey.create({
      data: { userId: session.user.id, name, key, scopes },
    });

    return NextResponse.json({ ok: true, id: apiKey.id, key });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing key id" }, { status: 400 });

    const key = await prisma.apiKey.findUnique({ where: { id } });
    if (!key || key.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.apiKey.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, isActive } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing key id" }, { status: 400 });

    const key = await prisma.apiKey.findUnique({ where: { id } });
    if (!key || key.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.apiKey.update({
      where: { id },
      data: { isActive },
      select: { id: true, name: true, scopes: true, isActive: true, lastUsedAt: true },
    });

    return NextResponse.json({ ok: true, key: updated });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}