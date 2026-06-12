import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["CREATOR", "MODERATOR", "ADMIN", "ENTERPRISE"].includes(session.user.role)) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: "CREATOR" },
    });
    await prisma.creatorProfile.upsert({
      where: { userId: session.user.id },
      update: {},
      create: { userId: session.user.id },
    });
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "user_upgraded_creator",
        targetType: "User",
        targetId: session.user.id,
        metadata: JSON.stringify({ reason: "first_agent_publish" }),
      },
    });
    session.user.role = "CREATOR";
  }

  try {
    const body = await req.json();
    const { name, category, systemPrompt, pricingType, creditsPerRun } = body;

    if (!name || !category) {
      return NextResponse.json({ error: "Name and category are required" }, { status: 400 });
    }

    let slug = body.slug || slugify(name);

    const existing = await prisma.agent.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const agent = await prisma.agent.create({
      data: {
        creatorId: session.user.id,
        name,
        slug,
        category,
        status: "PENDING",
        systemPrompt: systemPrompt || "",
        pricingType: pricingType || "FREE",
        creditsPerRun: creditsPerRun || 0,
        modelProvider: "gemini",
      },
    });

    return NextResponse.json({ ok: true, slug: agent.slug, id: agent.id }, { status: 201 });
  } catch (error) {
    console.error("create agent error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const query = searchParams.get("q");

  const where: Record<string, unknown> = { status: "PUBLISHED" };
  if (category && category !== "ALL") where.category = category;
  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { systemPrompt: { contains: query, mode: "insensitive" } },
    ];
  }

  const agents = await prisma.agent.findMany({
    where: where as any,
    orderBy: { totalRuns: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      pricingType: true,
      creditsPerRun: true,
      totalRuns: true,
      avgRating: true,
      creator: { select: { username: true } },
    },
    take: 50,
  });

  return NextResponse.json({ agents });
}
