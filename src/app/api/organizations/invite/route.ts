import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { organizationId, email, role } = await req.json();

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { _count: { select: { members: true } } },
    });
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    if (org.ownerId !== session.user.id) return NextResponse.json({ error: "Only the owner can invite" }, { status: 403 });
    if (org._count.members >= org.maxMembers) return NextResponse.json({ error: "Member limit reached" }, { status: 400 });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const member = await prisma.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId, userId: existingUser.id } },
      });
      if (member) return NextResponse.json({ error: "User is already a member" }, { status: 400 });
    }

    const existingInvite = await prisma.organizationInvite.findFirst({
      where: { organizationId, email, acceptedAt: null, expiresAt: { gt: new Date() } },
    });
    if (existingInvite) return NextResponse.json({ error: "An active invite already exists for this email" }, { status: 400 });

    const token = crypto.randomBytes(32).toString("hex");
    const invite = await prisma.organizationInvite.create({
      data: {
        organizationId,
        email: email.toLowerCase().trim(),
        role: role || "MEMBER",
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ ok: true, invite: { id: invite.id, email: invite.email, token: invite.token, expiresAt: invite.expiresAt } });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { token } = await req.json();

    const invite = await prisma.organizationInvite.findUnique({
      where: { token },
      include: { organization: { select: { name: true, slug: true } } },
    });
    if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    if (invite.acceptedAt) return NextResponse.json({ error: "Invite already accepted" }, { status: 400 });
    if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Invite expired" }, { status: 400 });
    if (invite.email.toLowerCase() !== session.user.email?.toLowerCase()) return NextResponse.json({ error: "This invite is for a different email" }, { status: 403 });

    const existingMember = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: invite.organizationId, userId: session.user.id } },
    });
    if (existingMember) return NextResponse.json({ error: "Already a member" }, { status: 400 });

    await prisma.$transaction([
      prisma.organizationInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } }),
      prisma.organizationMember.create({ data: { organizationId: invite.organizationId, userId: session.user.id, role: invite.role } }),
    ]);

    return NextResponse.json({ ok: true, organization: { id: invite.organizationId, name: invite.organization.name, slug: invite.organization.slug } });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}