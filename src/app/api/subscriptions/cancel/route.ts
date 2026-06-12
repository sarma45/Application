import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let subscription = await prisma.subscription.findFirst({
      where: { userId: session.user.id },
    });

    if (!subscription) {
      return NextResponse.json({ error: "No active subscription" }, { status: 404 });
    }

    if (subscription.providerSubId && process.env.STRIPE_SECRET) {
      await stripe.subscriptions.update(subscription.providerSubId, {
        cancel_at_period_end: true,
      });
    }

    subscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true, status: "canceling" },
    });

    logger.info("Subscription canceled", { userId: session.user.id, plan: subscription.plan });

    return NextResponse.json({ ok: true, message: "Subscription will cancel at period end" });
  } catch (error) {
    logger.error("Cancel subscription error", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
