import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { cacheGet, cacheSet, cacheDel, CACHE_TTL } from "@/lib/redis";
import { createAgentSchema, listAgentsSchema } from "@/lib/validations";

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
    const parsed = createAgentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, category, systemPrompt, pricingType, creditsPerRun, slug: customSlug } = parsed.data;
    let slug = customSlug || slugify(name);

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

    await prisma.agentVersion.create({
      data: {
        agentId: agent.id,
        version: "1.0.0",
        changelog: "Initial version",
        config: JSON.stringify({ name, category, systemPrompt, pricingType, creditsPerRun }),
      },
    });

    await cacheDel("home:featured");

    return NextResponse.json({ ok: true, slug: agent.slug, id: agent.id }, { status: 201 });
  } catch (error) {
    console.error("create agent error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const params = listAgentsSchema.parse({
    category: searchParams.get("category"),
    q: searchParams.get("q"),
  });

  const where: Record<string, unknown> = { status: "PUBLISHED" };
  if (params.category && params.category !== "ALL") where.category = params.category;
  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: "insensitive" } },
      { systemPrompt: { contains: params.q, mode: "insensitive" } },
    ];
  }

  const cacheKey = `agents:api:${params.category || ""}:${params.q || ""}`;
  let agents = await cacheGet<any[]>(cacheKey);
  if (!agents) {
    agents = await prisma.agent.findMany({
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
    await cacheSet(cacheKey, agents, CACHE_TTL.SEARCH);
  }

  return NextResponse.json({ agents });
}
