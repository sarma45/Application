import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecret = process.env.STRIPE_SECRET;

  if (!sig || !webhookSecret || !stripeSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const checkoutSession = event.data.object as any;
      const userId = checkoutSession.metadata?.userId;
      const plan = checkoutSession.metadata?.plan;
      const subscriptionId = checkoutSession.subscription;

      if (userId && plan) {
        let currentPeriodEnd: Date | null = null;
        if (subscriptionId) {
          const stripeSub = await stripe.subscriptions.retrieve(subscriptionId) as any;
          if (stripeSub?.current_period_end) {
            currentPeriodEnd = new Date(stripeSub.current_period_end * 1000);
          }
        }

        const existing = await prisma.subscription.findFirst({ where: { userId } });
        const data = {
          plan,
          status: "active" as const,
          providerSubId: subscriptionId || null,
          currentPeriodEnd,
        };

        if (existing) {
          await prisma.subscription.update({ where: { id: existing.id }, data });
        } else {
          await prisma.subscription.create({
            data: {
              userId,
              ...data,
              providerSubId: subscriptionId || null,
            },
          });
        }

        await prisma.user.update({
          where: { id: userId },
          data: { plan },
        });

        logger.info("Subscription activated via webhook", { userId, plan });
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as any;
      const subRecord = await prisma.subscription.findFirst({
        where: { providerSubId: subscription.id },
      });

      if (subRecord) {
        await prisma.subscription.update({
          where: { id: subRecord.id },
          data: {
            status: subscription.status === "active" ? "active" : "past_due",
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
          },
        });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as any;
      const subRecord = await prisma.subscription.findFirst({
        where: { providerSubId: subscription.id },
      });

      if (subRecord) {
        await prisma.subscription.update({
          where: { id: subRecord.id },
          data: { status: "canceled" },
        });

        await prisma.user.update({
          where: { id: subRecord.userId },
          data: { plan: "FREE" },
        });
      }
    }
  } catch (error) {
    logger.error("Subscription webhook error", { error: String(error) });
  }

  return NextResponse.json({ received: true });
}
