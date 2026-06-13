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

  if (loading) return <div className="container-main py-8"><p className="text-secondary">Loading...</p></div>;

  return (
    <div className="container-main py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-theme">Payouts</h1>
        <p className="text-sm text-secondary">Manage your earnings and request payouts</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-secondary">Available Balance</p>
            <p className="text-3xl font-bold text-emerald-400 mt-1">${(balance * 0.001).toFixed(2)}</p>
            <p className="text-xs text-muted mt-1">{formatCredits(balance)} credits (1000 credits = $1)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-secondary">Request Payout</p>
            <p className="text-xs text-secondary mt-1 mb-3">Minimum payout: $10.00 (10,000 credits)</p>
            <Button size="sm" disabled={balance < 10000}>Request Payout</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-theme">Payout History</h2>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="text-sm text-secondary">No payouts yet</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {payouts.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between py-2 border-b border-light last:border-0">
                  <div>
                    <p className="text-sm font-medium text-theme">${payout.amountUsd}</p>
                    <p className="text-xs text-muted">{formatDate(payout.createdAt)}</p>
                  </div>
                  <Badge variant={payout.status === "COMPLETED" ? "success" : payout.status === "PENDING" ? "warning" : "default"}>
                    {payout.status}
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
