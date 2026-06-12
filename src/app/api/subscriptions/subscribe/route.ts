import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const PLAN_PRICES: Record<string, { monthly: number; stripePriceId?: string }> = {
  PRO: { monthly: 1900 },
  CREATOR: { monthly: 3900 },
  BUSINESS: { monthly: 9900 },
};

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { plan, billingCycle = "monthly" } = await req.json();

    if (!PLAN_PRICES[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!process.env.STRIPE_SECRET) {
      return NextResponse.json({ error: "Payments not configured" }, { status: 503 });
    }

    const price = PLAN_PRICES[plan].monthly;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `AIVerse ${plan} Plan` },
            unit_amount: billingCycle === "annual" ? price * 10 : price,
            recurring: { interval: billingCycle === "annual" ? "year" : "month" },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
        plan,
      },
      success_url: new URL("/wallet?success=subscribed", req.url).toString(),
      cancel_url: new URL("/pricing?error=cancelled", req.url).toString(),
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    logger.error("Subscribe error", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
