import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const checkoutSession = event.data.object as any;
    const userId = checkoutSession.metadata?.userId as string;
    const credits = parseInt(checkoutSession.metadata?.credits ?? "0");

    if (!userId || !credits) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.upsert({
        where: { userId },
        update: {},
        create: { userId, balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 },
      });

      await tx.wallet.update({
        where: { userId },
        data: {
          balance: wallet.balance + credits,
          lifetimeEarned: wallet.lifetimeEarned + credits,
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: "PURCHASE",
          amount: credits,
          balanceAfter: wallet.balance + credits,
          referenceType: "StripePayment",
          referenceId: checkoutSession.id,
        },
      });
    });
  }

  return NextResponse.json({ received: true });
}
