import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { unauthorized, notFound } from "@/lib/api-helpers";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      plan: true,
      isActive: true,
      createdAt: true,
      creatorProfile: true,
    },
  });

  if (!user) return notFound("User not found");

  return NextResponse.json({ ok: true, user });
}
