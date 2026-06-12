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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      wallets: true,
      subscriptions: true,
      agents: { select: { id: true, name: true, slug: true, status: true } },
      agentExecutions: { take: 100, orderBy: { createdAt: "desc" } },
      referralsMade: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const data = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    plan: user.plan,
    isActive: user.isActive,
    createdAt: user.createdAt,
    wallets: user.wallets,
    subscriptions: user.subscriptions,
    agents: user.agents,
    recentExecutions: user.agentExecutions,
    referrals: user.referralsMade,
  };

  return NextResponse.json({ data });
}
