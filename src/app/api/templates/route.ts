import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category");

  const where: Record<string, unknown> = {};
  if (category && category !== "ALL") where.category = category;

  const templates = await prisma.agentTemplate.findMany({
    where: where as any,
    orderBy: [{ isFeatured: "desc" }, { usageCount: "desc" }],
    take: 50,
  });

  return NextResponse.json({ templates });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, slug, description, category, systemPrompt, toolsConfig, tags } = body;

    const existing = await prisma.agentTemplate.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const template = await prisma.agentTemplate.create({
      data: {
        name,
        slug: finalSlug,
        description,
        category: category || "CHAT",
        systemPrompt,
        toolsConfig,
        tags: tags || [],
      },
    });

    return NextResponse.json({ ok: true, template }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}