import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet, cacheDel, CACHE_TTL } from "@/lib/redis";
import { updateAgentSchema } from "@/lib/validations";
import { generateEmbedding } from "@/lib/ai/embeddings";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const cached = await cacheGet<any>(`agent:${slug}`);
  if (cached) {
    return NextResponse.json({ agent: cached });
  }

  const agent = await prisma.agent.findUnique({
    where: { slug },
    include: {
      creator: { select: { username: true, id: true } },
    },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  await cacheSet(`agent:${slug}`, agent, CACHE_TTL.AGENT_DETAIL);

  return NextResponse.json({ agent });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const body = await req.json();
    const parsed = updateAgentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const agent = await prisma.agent.findUnique({ where: { slug }, select: { id: true, creatorId: true } });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (agent.creatorId !== session.user.id && !["ADMIN", "MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.agent.update({
      where: { id: agent.id },
      data: parsed.data,
    });

    await cacheDel(`agent:${slug}`);

    const textForEmbedding = `${updated.name} ${updated.systemPrompt}`;
    generateEmbedding(textForEmbedding).then((embedding) => {
      if (embedding.length > 0) {
        prisma.$executeRawUnsafe(`UPDATE "Agent" SET embedding = $1::vector WHERE id = $2`, JSON.stringify(embedding), agent.id).catch(() => {});
      }
    });

    return NextResponse.json({ ok: true, agent: updated });
  } catch (error) {
    console.error("update agent error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const agent = await prisma.agent.findUnique({ where: { slug }, select: { id: true, creatorId: true } });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (agent.creatorId !== session.user.id && !["ADMIN", "MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.agent.delete({ where: { id: agent.id } });
    await cacheDel(`agent:${slug}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("delete agent error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
