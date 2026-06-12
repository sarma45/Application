"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCredits, formatDate } from "@/lib/utils";

interface Payout {
  id: string;
  amountUsd: string;
  creditsRedeemed: number | null;
  status: string;
  createdAt: string;
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/payouts").then((r) => r.json()),
      fetch("/api/wallet").then((r) => r.json()),
    ]).then(([payoutData, walletData]) => {
      setPayouts(payoutData.data || []);
      setBalance(walletData.wallet?.balance || 0);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="container-main py-8"><p className="text-zinc-500">Loading...</p></div>;

  return (
    <div className="container-main py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Payouts</h1>
        <p className="text-sm text-zinc-500">Manage your earnings and request payouts</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-zinc-500">Available Balance</p>
            <p className="text-3xl font-bold text-emerald-400 mt-1">${(balance * 0.001).toFixed(2)}</p>
            <p className="text-xs text-zinc-600 mt-1">{formatCredits(balance)} credits (1000 credits = $1)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-zinc-500">Total Payouts</p>
            <p className="text-3xl font-bold text-white mt-1">{payouts.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardContent className="p-5">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">Request Payout</h2>
          <p className="text-sm text-zinc-500 mb-4">
            Minimum payout: $10 equivalent (10,000 credits). Payouts processed on the 1st of each month.
          </p>
          <form action="/api/payouts/request" method="POST">
            <Button type="submit" variant="primary">Request Payout</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-zinc-100">Payout History</h2>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="text-sm text-zinc-500">No payouts yet</p>
          ) : (
            <div className="space-y-3">
              {payouts.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">${p.amountUsd}</p>
                    <p className="text-xs text-zinc-600">{formatDate(p.createdAt)}</p>
                  </div>
                  <Badge variant={p.status === "COMPLETED" ? "success" : p.status === "PENDING" ? "warning" : "danger"}>
                    {p.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
