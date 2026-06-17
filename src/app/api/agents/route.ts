import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { cacheGet, cacheSet, cacheDel, CACHE_TTL } from "@/lib/redis";
import { createAgentSchema, listAgentsSchema } from "@/lib/validations";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { unauthorized, serverError } from "@/lib/api-helpers";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return unauthorized();
  }

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isActive: true, role: true } });
  if (!dbUser?.isActive) {
    return NextResponse.json({ error: "Please verify your email before publishing agents", code: "EMAIL_NOT_VERIFIED" }, { status: 403 });
  }

  if (!["CREATOR", "MODERATOR", "ADMIN", "ENTERPRISE"].includes(dbUser.role)) {
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
  }

  try {
    const body = await req.json();
    const parsed = createAgentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, category, systemPrompt, pricingType, creditsPerRun, modelProvider, modelId } = parsed.data;
    const baseSlug = slugify(name);

    let agent;
    try {
      agent = await prisma.agent.create({
        data: {
          creatorId: session.user.id,
          name,
          slug: baseSlug,
          category,
          status: "DRAFT",
          systemPrompt: systemPrompt || "",
          pricingType: pricingType || "FREE",
          creditsPerRun: creditsPerRun || 0,
          modelProvider: modelProvider || "gemini",
          modelId: modelId || null,
        },
      });
    } catch (err: any) {
      if (err?.code === "P2002" && err?.meta?.target?.includes("slug")) {
        const suffix = crypto.randomUUID().slice(0, 8);
        agent = await prisma.agent.create({
          data: {
            creatorId: session.user.id,
            name,
            slug: `${baseSlug}-${suffix}`,
            category,
            status: "DRAFT",
            systemPrompt: systemPrompt || "",
            pricingType: pricingType || "FREE",
            creditsPerRun: creditsPerRun || 0,
            modelProvider: modelProvider || "gemini",
            modelId: modelId || null,
          },
        });
      } else {
        throw err;
      }
    }

    await prisma.agentVersion.create({
      data: {
        agentId: agent.id,
        version: "1.0.0",
        changelog: "Initial version",
        config: { name, category, systemPrompt, pricingType, creditsPerRun },
      },
    });

    await cacheDel("home:featured");
    await cacheDel(`agents:${category}:page1`);

    generateEmbedding(`${agent.name} ${agent.systemPrompt}`).then((embedding) => {
      if (embedding.length > 0) {
        prisma.$executeRawUnsafe(`UPDATE "Agent" SET embedding = $1::vector WHERE id = $2`, JSON.stringify(embedding), agent.id).catch(() => {});
      }
    });

    return NextResponse.json({ ok: true, slug: agent.slug, id: agent.id }, { status: 201 });
  } catch (error) {
    console.error("create agent error", error);
    return serverError();
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const params = listAgentsSchema.parse({
    category: searchParams.get("category"),
    q: searchParams.get("q"),
    mine: searchParams.get("mine"),
    sort: searchParams.get("sort"),
  });

  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);

  const cacheKey = !cursor && !params.q && params.mine !== "true"
    ? `agents:${params.category || "ALL"}:page1`
    : null;

  if (cacheKey) {
    const cached = await cacheGet<{ agents: AgentWithMeta[]; nextCursor: string | null }>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }
  }

  const where: Record<string, unknown> = {};

  if (params.mine === "true") {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    where.creatorId = session.user.id;
  } else {
    where.status = "APPROVED";
    if (params.category && params.category !== "ALL") where.category = params.category;
  }

  // Semantic search via pgvector
  let useSemanticSearch = false;
  let queryEmbedding: number[] = [];
  if (params.q && params.mine !== "true") {
    queryEmbedding = await generateEmbedding(params.q);
    if (queryEmbedding.length > 0) {
      useSemanticSearch = true;
    }
  }

  interface AgentRaw {
    id: string;
    name: string;
    slug: string;
    category: string;
    pricingType: string;
    creditsPerRun: number;
    totalRuns: number;
    avgRating: number | null;
    isFeatured: boolean;
    status: string;
    createdAt: Date;
  }

  interface AgentWithMeta extends AgentRaw {
    creator: { username: string | null; email: string } | null;
    _count?: { executions: number };
  }

  let agents: AgentWithMeta[];
  if (useSemanticSearch) {
    const vectorStr = `[${queryEmbedding.join(",")}]`;
    const categoryFilter = params.category && params.category !== "ALL"
      ? prisma.$queryRaw`AND category = ${params.category}::text`
      : prisma.$queryRaw``;
    const raw = await prisma.$queryRaw<AgentRaw[]>`
      SELECT id, name, slug, category, "pricingType", "creditsPerRun", "totalRuns", "avgRating", "isFeatured", status, "createdAt"
      FROM "Agent"
      WHERE status = 'APPROVED'::text
      ${categoryFilter}
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT ${limit + 1}
    `;
    agents = raw.map((a) => ({
      ...a,
      id: String(a.id),
      creator: null,
    }));
  } else {
    if (params.q && params.mine !== "true") {
      where.OR = [
        { name: { contains: params.q, mode: "insensitive" as const } },
        { description: { contains: params.q, mode: "insensitive" as const } },
      ];
    }

    if (params.sort === "newest") {
      const found = await prisma.agent.findMany({
        where: where as any,
        orderBy: { createdAt: "desc" },
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
        take: limit + 1,
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          pricingType: true,
          creditsPerRun: true,
          totalRuns: true,
          avgRating: true,
          isFeatured: true,
          status: true,
          createdAt: true,
          creator: { select: { username: true, email: true } },
        },
      });
      agents = found;
    } else if (params.sort === "trending") {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const found = await prisma.agent.findMany({
        where: where as any,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
        take: limit + 1,
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          pricingType: true,
          creditsPerRun: true,
          totalRuns: true,
          avgRating: true,
          isFeatured: true,
          status: true,
          createdAt: true,
          creator: { select: { username: true, email: true } },
          _count: {
            select: {
              executions: { where: { createdAt: { gte: sevenDaysAgo } } },
            },
          },
        },
      });
      agents = (found as AgentWithMeta[]).sort((a, b) => (b._count?.executions ?? 0) - (a._count?.executions ?? 0));
    } else {
      const found = await prisma.agent.findMany({
        where: where as any,
        orderBy: { totalRuns: "desc" },
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
        take: limit + 1,
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          pricingType: true,
          creditsPerRun: true,
          totalRuns: true,
          avgRating: true,
          isFeatured: true,
          status: true,
          createdAt: true,
          creator: { select: { username: true, email: true } },
        },
      });
      agents = found;
    }
  }

  const hasMore = agents.length > limit;
  const items = hasMore ? agents.slice(0, limit) : agents;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  const result = { agents: items, nextCursor };

  if (cacheKey) {
    await cacheSet(cacheKey, result, CACHE_TTL.SEARCH);
  }

  return NextResponse.json(result);
}
