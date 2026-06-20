import Stripe from "stripe";

let _stripe: Stripe | null = null;

function createStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET!, { apiVersion: "2024-11-20.acacia" as any });
}

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET) {
      throw new Error("Stripe is not configured: set STRIPE_SECRET");
    }
    _stripe = createStripe();
  }
  return _stripe;
}

export const CREDIT_PACKAGES = [
  { credits: 100, priceCents: 499, label: "Starter" },
  { credits: 500, priceCents: 1999, label: "Popular" },
  { credits: 2000, priceCents: 6999, label: "Pro" },
  { credits: 10000, priceCents: 29999, label: "Enterprise" },
];
