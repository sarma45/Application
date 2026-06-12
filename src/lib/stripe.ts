import Stripe from "stripe";

function createStripe(): Stripe {
  const key = process.env.STRIPE_SECRET;
  if (!key) {
    return null as unknown as Stripe;
  }
  return new Stripe(key, { typescript: true });
}

export const stripe = createStripe();

export const CREDIT_PACKAGES: Record<number, number> = {
  100: 1.99,
  500: 7.99,
  1500: 19.99,
  5000: 49.99,
  20000: 149.99,
};

export function getPricePerCredit(credits: number): number {
  return CREDIT_PACKAGES[credits] ?? 0;
}
