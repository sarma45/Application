"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const plans = [
  {
    name: "Free",
    price: 0,
    credits: 100,
    runs: 10,
    features: [
      "Browse and run agents",
      "100 monthly credits",
      "10 agent runs per day",
      "Basic support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: 19,
    credits: 1000,
    runs: 100,
    features: [
      "Everything in Free",
      "1,000 monthly credits",
      "100 agent runs per day",
      "API access",
      "Email support",
    ],
    cta: "Subscribe",
    popular: true,
  },
  {
    name: "Creator",
    price: 39,
    credits: 2000,
    runs: 200,
    features: [
      "Everything in Pro",
      "2,000 monthly credits",
      "200 agent runs per day",
      "Publish and monetize agents",
      "80% revenue share",
      "Creator dashboard & analytics",
      "Priority support",
    ],
    cta: "Subscribe",
    popular: false,
  },
  {
    name: "Business",
    price: 99,
    credits: 10000,
    runs: 1000,
    features: [
      "Everything in Creator",
      "10,000 monthly credits",
      "1,000 agent runs per day",
      "10 team members",
      "Custom models",
      "Dedicated CSM",
      "99.5% SLA",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSubscribe(plan: string) {
    if (plan === "Business") {
      window.location.href = "mailto:sales@aiverse.ai";
      return;
    }
    if (plan === "Free") {
      router.push("/register");
      return;
    }

    setLoading(plan);
    try {
      const res = await fetch("/api/subscriptions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.toUpperCase(), billingCycle: "monthly" }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // fallback
    }
    setLoading(null);
  }

  return (
    <div className="container-main py-16">
      <div className="text-center mb-12">
        <Badge variant="purple" className="mb-4">Pricing</Badge>
        <h1 className="text-4xl font-bold text-theme">Simple, transparent pricing</h1>
        <p className="mt-2 text-secondary">Choose the plan that fits your needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative p-6 flex flex-col ${plan.popular ? "ring-1 ring-purple-500/50" : ""}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="purple">Most Popular</Badge>
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-theme">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-theme">
                  {plan.price === 0 ? "Free" : `$${plan.price}`}
                </span>
                {plan.price > 0 && <span className="text-sm text-secondary">/mo</span>}
              </div>
              <div className="mt-3 space-y-1 text-sm text-secondary">
                <p>{plan.credits.toLocaleString()} credits/mo</p>
                <p>{plan.runs} runs/day</p>
              </div>
            </div>
            <ul className="space-y-2 mb-6 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-theme">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Button
              variant={plan.popular ? "primary" : "secondary"}
              className="w-full"
              loading={loading === plan.name}
              onClick={() => handleSubscribe(plan.name)}
            >
              {plan.cta}
            </Button>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-secondary">
          Need enterprise features?{" "}
          <a href="mailto:sales@aiverse.ai" className="text-purple-400 hover:text-purple-300 transition-colors">
            Contact our sales team
          </a>
        </p>
      </div>
    </div>
  );
}
