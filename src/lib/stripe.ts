import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET ?? "", {
  typescript: true,
});

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
