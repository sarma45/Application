import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgs = await prisma.organization.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      owner: { select: { email: true, username: true } },
      _count: { select: { members: true } },
    },
  });

  return NextResponse.json({ organizations: orgs });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name } = await req.json();
    if (!name || name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: "Name must be 2-100 characters" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const existing = await prisma.organization.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const org = await prisma.organization.create({
      data: { name, slug: finalSlug, ownerId: session.user.id, plan: "BUSINESS" },
    });

    await prisma.organizationMember.create({
      data: { organizationId: org.id, userId: session.user.id, role: "OWNER" },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "org_created",
        targetType: "Organization",
        targetId: org.id,
        metadata: JSON.stringify({ name, slug: finalSlug }),
      },
    });

    return NextResponse.json({ ok: true, organization: { id: org.id, name: org.name, slug: org.slug } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}