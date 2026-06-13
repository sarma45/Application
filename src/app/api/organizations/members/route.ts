import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { organizationId, userId } = await req.json();

    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    if (org.ownerId !== session.user.id && session.user.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (userId === org.ownerId) {
      return NextResponse.json({ error: "Owner cannot leave. Transfer ownership first." }, { status: 400 });
    }

    await prisma.organizationMember.delete({
      where: { organizationId_userId: { organizationId, userId } },
    });

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
    const { organizationId, userId, role } = await req.json();

    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    if (org.ownerId !== session.user.id) return NextResponse.json({ error: "Only the owner can change roles" }, { status: 403 });

    await prisma.organizationMember.update({
      where: { organizationId_userId: { organizationId, userId } },
      data: { role },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const organizationId = url.searchParams.get("organizationId");
  if (!organizationId) return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });

  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isMember = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: session.user.id } },
  });
  if (!isMember && org.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [members, invites] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { organizationId },
      include: { user: { select: { email: true, username: true } } },
    }),
    prisma.organizationInvite.findMany({
      where: { organizationId, acceptedAt: null, expiresAt: { gt: new Date() } },
    }),
  ]);

  return NextResponse.json({ members, invites });
}