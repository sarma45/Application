"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const FALLBACK_PLANS: Record<string, { name: string; price: number; credits: number; runs: number; features: string[]; currency: string }> = {
  PRO: { name: "Pro", price: 1900, credits: 1000, runs: 100, features: ["1,000 monthly credits", "100 agent runs per day", "API access", "Email support"], currency: "USD" },
  CREATOR: { name: "Creator", price: 3900, credits: 2000, runs: 200, features: ["2,000 monthly credits", "200 agent runs per day", "Publish and monetize agents", "80% revenue share", "Creator dashboard & analytics", "Priority support"], currency: "USD" },
  BUSINESS: { name: "Business", price: 9900, credits: 10000, runs: 1000, features: ["10,000 monthly credits", "1,000 agent runs per day", "10 team members", "Custom models", "Dedicated CSM", "99.5% SLA"], currency: "USD" },
};

function SubscribeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planKey = (searchParams.get("plan") || "PRO").toUpperCase();

  const [plan, setPlan] = useState(FALLBACK_PLANS[planKey] || FALLBACK_PLANS.PRO);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(["card"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch("/api/subscriptions/plans")
      .then((r) => r.json())
      .then(({ data }) => {
        const match = data.find((p: { id: string }) => p.id === planKey);
        if (match) {
          setPlan({
            name: match.name,
            price: match.price,
            credits: match.creditsPerMonth,
            runs: match.runsPerDay,
            features: match.features,
            currency: match.currency,
          });
          setPaymentMethods(match.paymentMethods);
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [planKey]);

  function displayPrice(cents: number, currency: string) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(cents / 100);
  }

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/subscriptions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey, billingCycle: "monthly" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        setError(data.error);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    }
    setLoading(false);
  }

  const priceLabel = fetching
    ? "Loading..."
    : `${displayPrice(plan.price, plan.currency)}/mo`;

  return (
    <div className="container-main py-16 max-w-2xl">
      <div className="text-center mb-10">
        <Badge variant="purple" className="mb-4">Subscribe</Badge>
        <h1 className="text-3xl font-bold text-theme">Confirm your plan</h1>
        <p className="mt-2 text-secondary">Review your subscription details below</p>
      </div>

      <Card className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-theme">{plan.name} Plan</h2>
            <p className="text-3xl font-bold text-theme mt-2">
              {displayPrice(plan.price, plan.currency)}<span className="text-base font-normal text-secondary">/mo</span>
            </p>
          </div>
          <Badge variant="purple" className="text-sm">{plan.credits.toLocaleString()} credits/mo</Badge>
        </div>

        <div className="border-t border-white/10 pt-6 mb-6">
          <h3 className="text-sm font-medium text-secondary mb-3">What&apos;s included:</h3>
          <ul className="space-y-2">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-theme">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-white/10 pt-4 mb-6">
          <h3 className="text-sm font-medium text-secondary mb-2">Accepted payment methods:</h3>
          <div className="flex flex-wrap gap-2">
            {paymentMethods.map((pm) => (
              <Badge key={pm} variant="default" className="text-xs capitalize">{pm.replace("_", " ")}</Badge>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        <Button
          variant="primary"
          className="w-full"
          loading={loading}
          onClick={handleConfirm}
        >
          Confirm & Pay — {priceLabel}
        </Button>

        <p className="mt-4 text-xs text-center text-secondary">
          Your card will be charged monthly. You can cancel anytime.
        </p>
      </Card>

      <div className="text-center mt-6">
        <button
          onClick={() => router.push("/pricing")}
          className="text-sm text-secondary hover:text-theme transition-colors"
        >
          ← Back to pricing
        </button>
      </div>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense fallback={
      <div className="container-main py-16 max-w-2xl text-center">
        <p className="text-secondary">Loading...</p>
      </div>
    }>
      <SubscribeContent />
    </Suspense>
  );
}
