import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { detectCountry, countryToRegion } from "@/lib/location";
import { getRegion, adjustedPrice, REGION_CONFIGS } from "@/lib/pricing-regions";

const PLAN_PRICES: Record<string, { monthly: number; stripePriceId?: string }> = {
  PRO: { monthly: 1900 },
  CREATOR: { monthly: 3900 },
  BUSINESS: { monthly: 9900 },
};

const FREE_CREDITS_ON_SIGNUP = 100;

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { plan, billingCycle = "monthly" } = await req.json();

    if (plan === "FREE") {
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { plan: true },
      });

      if (currentUser?.plan !== "FREE") {
        await prisma.wallet.upsert({
          where: { userId: session.user.id },
          update: { balance: { increment: FREE_CREDITS_ON_SIGNUP } },
          create: { userId: session.user.id, balance: FREE_CREDITS_ON_SIGNUP },
        });
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: { plan: "FREE" },
      });
      return NextResponse.json({ ok: true, plan: "FREE" });
    }

    if (plan === "ENTERPRISE") {
      return NextResponse.json({ error: "Contact sales@aiverse.ai for Enterprise plan" }, { status: 400 });
    }

    if (!PLAN_PRICES[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!process.env.STRIPE_SECRET) {
      return NextResponse.json({ error: "Payments not configured" }, { status: 503 });
    }

    const country = detectCountry(req);
    const region = getRegion(countryToRegion(country));
    const cfg = REGION_CONFIGS[region];
    const basePrice = PLAN_PRICES[plan].monthly;
    const unitAmount = adjustedPrice(basePrice, region);

    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: "subscription",
      payment_method_types: cfg.paymentMethods as any,
      line_items: [
        {
          price_data: {
            currency: cfg.currency,
            product_data: { name: `AIVerse ${plan} Plan` },
            unit_amount: billingCycle === "annual" ? unitAmount * 10 : unitAmount,
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
