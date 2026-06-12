import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { stripe, CREDIT_PACKAGES, getPricePerCredit } from "@/lib/stripe";
import { checkoutSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const credits = parseInt(formData.get("credits") as string);

    if (!credits || !CREDIT_PACKAGES[credits]) {
      return NextResponse.json({ error: "Invalid credit package" }, { status: 400 });
    }

    if (!process.env.STRIPE_SECRET) {
      return NextResponse.json({ error: "Payments not configured" }, { status: 503 });
    }

    const price = getPricePerCredit(credits);

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${credits} AIVerse Credits`,
              description: `Credit package for AI agent execution`,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
        credits: String(credits),
      },
      success_url: new URL(`/wallet?success=true&credits=${credits}`, req.url).toString(),
      cancel_url: new URL("/wallet?error=cancelled", req.url).toString(),
    });

    return NextResponse.redirect(checkoutSession.url ?? "/wallet?error=checkout_failed");
  } catch (error) {
    console.error("checkout error", error);
    return NextResponse.redirect(new URL("/wallet?error=checkout_failed", req.url));
  }
}
