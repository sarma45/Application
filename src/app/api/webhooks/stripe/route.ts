import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;
    const userId = checkoutSession.metadata?.userId ?? "";
    const credits = parseInt(checkoutSession.metadata?.credits ?? "0");
    const amountUsd = (checkoutSession.amount_total ?? 0) / 100;

    if (!userId || !credits) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const existing = await prisma.payment.findFirst({
      where: { providerPaymentId: checkoutSession.id },
    });
    if (existing) {
      return NextResponse.json({ received: true, deduplicated: true });
    }

    await prisma.$transaction(async (tx) => {
      await tx.wallet.upsert({
        where: { userId },
        update: {},
        create: { userId, balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 },
      });

      const updated = await tx.wallet.update({
        where: { userId },
        data: {
          balance: { increment: credits },
          lifetimeEarned: { increment: credits },
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: "PURCHASE",
          amount: credits,
          balanceAfter: updated.balance,
          referenceType: "StripePayment",
          referenceId: checkoutSession.id,
        },
      });

      await tx.payment.create({
        data: {
          userId,
          provider: "STRIPE",
          providerPaymentId: checkoutSession.id,
          amountUsd,
          creditsGranted: credits,
          status: "COMPLETED",
        },
      });
    });
  }

  return NextResponse.json({ received: true });
}
