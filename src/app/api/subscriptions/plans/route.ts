import { NextResponse } from "next/server";

export const runtime = "nodejs";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    currency: "USD",
    interval: "month",
    features: [
      "5 agent executions per day",
      "Basic chat agents",
      "Community support",
    ],
    creditsPerMonth: 0,
  },
  {
    id: "pro",
    name: "Pro",
    price: 1999,
    currency: "USD",
    interval: "month",
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || "",
    features: [
      "Unlimited agent executions",
      "All agent categories (Chat, Code, Data, Workflow)",
      "Priority support",
      "Advanced analytics",
      "API access",
    ],
    creditsPerMonth: 5000,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 9999,
    currency: "USD",
    interval: "month",
    features: [
      "Everything in Pro",
      "Private agents",
      "SSO / SAML",
      "Dedicated infrastructure",
      "SLA guarantee",
      "Custom integrations",
    ],
    creditsPerMonth: 50000,
  },
];

export async function GET() {
  return NextResponse.json({ data: PLANS });
}
