import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.agentFavorite.deleteMany({ where: { userId: session.user.id } });
    await tx.agentExecution.deleteMany({ where: { userId: session.user.id } });
    await tx.agentReview.deleteMany({ where: { userId: session.user.id } });
    await tx.transaction.deleteMany({ where: { userId: session.user.id } });
    await tx.subscription.deleteMany({ where: { userId: session.user.id } });
    await tx.creatorPayout.deleteMany({ where: { creatorId: session.user.id } });
    await tx.referral.deleteMany({ where: { referrerId: session.user.id } });
    await tx.passwordReset.deleteMany({ where: { userId: session.user.id } });
    await tx.emailVerification.deleteMany({ where: { userId: session.user.id } });
    await tx.session.deleteMany({ where: { userId: session.user.id } });
    await tx.account.deleteMany({ where: { userId: session.user.id } });
    await tx.wallet.deleteMany({ where: { userId: session.user.id } });
    await tx.creatorProfile.deleteMany({ where: { userId: session.user.id } });
    await tx.agent.deleteMany({ where: { creatorId: session.user.id } });
    await tx.user.delete({ where: { id: session.user.id } });
  });

  return NextResponse.json({ ok: true });
}
