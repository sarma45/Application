import { NextResponse } from "next/server";
import { detectCountry, countryToRegion } from "@/lib/location";
import { getRegion, adjustedPrice, REGION_CONFIGS } from "@/lib/pricing-regions";

export const runtime = "nodejs";

const BASE_PLANS = [
  {
    id: "FREE",
    name: "Free",
    price: 0,
    interval: "month",
    features: [
      "Browse and run agents",
      "100 monthly credits",
      "10 agent runs per day",
      "Basic support",
    ],
    creditsPerMonth: 100,
    runsPerDay: 10,
  },
  {
    id: "PRO",
    name: "Pro",
    price: 1900,
    interval: "month",
    features: [
      "Everything in Free",
      "1,000 monthly credits",
      "100 agent runs per day",
      "API access",
      "Email support",
    ],
    creditsPerMonth: 1000,
    runsPerDay: 100,
  },
  {
    id: "CREATOR",
    name: "Creator",
    price: 3900,
    interval: "month",
    features: [
      "Everything in Pro",
      "2,000 monthly credits",
      "200 agent runs per day",
      "Publish and monetize agents",
      "80% revenue share",
      "Creator dashboard & analytics",
      "Priority support",
    ],
    creditsPerMonth: 2000,
    runsPerDay: 200,
  },
  {
    id: "BUSINESS",
    name: "Business",
    price: 9900,
    interval: "month",
    features: [
      "Everything in Creator",
      "10,000 monthly credits",
      "1,000 agent runs per day",
      "10 team members",
      "Custom models",
      "Dedicated CSM",
      "99.5% SLA",
    ],
    creditsPerMonth: 10000,
    runsPerDay: 1000,
  },
];

export async function GET(request: Request) {
  const country = detectCountry(request);
  const region = getRegion(countryToRegion(country));
  const cfg = REGION_CONFIGS[region];

  const plans = BASE_PLANS.map((p) => ({
    ...p,
    currency: cfg.currency.toUpperCase(),
    price: adjustedPrice(p.price, region),
    paymentMethods: cfg.paymentMethods,
  }));

  return NextResponse.json({ data: plans, region, country });
}
