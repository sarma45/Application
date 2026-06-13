import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { z } from "zod";

export const runtime = "nodejs";

const createWebhookSchema = z.object({
  url: z.string().url().max(500),
  events: z.array(z.enum(["agent.created", "agent.updated", "agent.deleted", "execution.completed", "execution.failed", "review.created"])).min(1),
});

function generateSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString("hex")}`;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webhooks = await prisma.webhook.findMany({
    where: { userId: session.user.id },
    select: { id: true, url: true, events: true, isActive: true, lastTriggeredAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ webhooks });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createWebhookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { url, events } = parsed.data;
    const secret = generateSecret();

    const webhook = await prisma.webhook.create({
      data: { userId: session.user.id, url, events, secret },
    });

    return NextResponse.json({ ok: true, webhook: { id: webhook.id, url: webhook.url, events: webhook.events, secret: webhook.secret } }, { status: 201 });
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
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const webhook = await prisma.webhook.findUnique({ where: { id } });
    if (!webhook || webhook.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.webhook.delete({ where: { id } });
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
    const { id, isActive, url, events } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const webhook = await prisma.webhook.findUnique({ where: { id } });
    if (!webhook || webhook.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (typeof isActive === "boolean") data.isActive = isActive;
    if (url) data.url = url;
    if (events) data.events = events;

    const updated = await prisma.webhook.update({ where: { id }, data });

    return NextResponse.json({ ok: true, webhook: { id: updated.id, url: updated.url, events: updated.events, isActive: updated.isActive } });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}