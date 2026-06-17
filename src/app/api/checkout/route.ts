import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { checkoutSchema } from "@/lib/validations";
import { unauthorized, badRequest, serverError } from "@/lib/api-helpers";
import { getStripe, CREDIT_PACKAGES } from "@/lib/stripe";
import { logger } from "@/lib/logger";
import { detectCountry, countryToRegion } from "@/lib/location";
import { getRegion, adjustedPrice, REGION_CONFIGS } from "@/lib/pricing-regions";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  try {
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Validation failed", parsed.error.flatten().fieldErrors);
    }

    const pkg = CREDIT_PACKAGES.find((p) => p.credits === parsed.data.credits);
    if (!pkg) {
      return badRequest("Invalid credit package");
    }

    const country = detectCountry(req);
    const region = getRegion(countryToRegion(country));
    const cfg = REGION_CONFIGS[region];

    const checkoutSession = await getStripe().checkout.sessions.create({
      customer_email: session.user.email || undefined,
      payment_method_types: cfg.paymentMethods as any,
      line_items: [
        {
          price_data: {
            currency: cfg.currency,
            product_data: { name: `${pkg.credits} Credits` },
            unit_amount: adjustedPrice(pkg.priceCents, region),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?payment=cancelled`,
      metadata: {
        userId: session.user.id,
        credits: String(pkg.credits),
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    logger.error("checkout error", { error: String(error) });
    return serverError();
  }
}
