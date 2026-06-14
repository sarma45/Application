import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
      wallets: { include: { transactions: { take: 500, orderBy: { createdAt: "desc" } } } },
      subscriptions: true,
      agents: {
        select: { id: true, name: true, slug: true, category: true, status: true, pricingType: true, creditsPerRun: true, totalRuns: true, avgRating: true, createdAt: true },
      },
      agentExecutions: { take: 500, orderBy: { createdAt: "desc" } },
      agentReviews: { include: { agent: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      payouts: { orderBy: { createdAt: "desc" } },
      referralsMade: true,
      referralsRedeemed: true,
      favorites: { include: { agent: { select: { name: true, slug: true } } } },
      files: { select: { id: true, fileName: true, fileType: true, fileSize: true, createdAt: true } },
      notifications: { take: 200, orderBy: { createdAt: "desc" } },
      accounts: { select: { provider: true, type: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const { password: _pw, ...safeUser } = user as any;

    const data = {
      exportedAt: new Date().toISOString(),
      userId: safeUser.id,
      profile: {
        email: safeUser.email,
        username: safeUser.username,
        role: safeUser.role,
        plan: safeUser.plan,
        isActive: safeUser.isActive,
        emailVerified: safeUser.emailVerified,
        createdAt: safeUser.createdAt,
      },
      wallets: safeUser.wallets?.map((w: any) => ({
        balance: w.balance,
        lifetimeEarned: w.lifetimeEarned,
        lifetimeSpent: w.lifetimeSpent,
        transactions: w.transactions,
      })),
      subscriptions: safeUser.subscriptions,
      agents: safeUser.agents,
      recentExecutions: safeUser.agentExecutions,
      reviews: safeUser.agentReviews,
      payouts: safeUser.payouts,
      referrals: {
        made: safeUser.referralsMade,
        redeemed: safeUser.referralsRedeemed,
      },
      favorites: safeUser.favorites,
      files: safeUser.files,
      notifications: safeUser.notifications,
      connectedAccounts: safeUser.accounts,
    };

    logger.info("GDPR data export", { userId: session.user.id });

    return NextResponse.json({ data });
  } catch (error) {
    logger.error("Export error", { error: String(error) });
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}