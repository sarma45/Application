"use client";

import { useEffect, useState } from "react";

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
      setBalance(walletData.balance || 0);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="min-h-screen bg-gray-950 text-gray-100 p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Payouts</h1>
        <p className="text-gray-400 mb-8">Manage your earnings and request payouts.</p>

        <div className="grid gap-6 md:grid-cols-2 mb-10">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <p className="text-sm text-gray-400">Available Balance</p>
            <p className="text-3xl font-bold text-emerald-400">${(balance * 0.001).toFixed(2)}</p>
            <p className="text-xs text-gray-500">{balance} credits (1000 credits = $1)</p>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <p className="text-sm text-gray-400">Total Payouts</p>
            <p className="text-3xl font-bold text-cyan-400">{payouts.length}</p>
          </div>
        </div>

        <form
          action="/api/payouts/request"
          method="POST"
          className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-10"
        >
          <h2 className="text-xl font-semibold mb-4">Request Payout</h2>
          <p className="text-sm text-gray-400 mb-4">
            Minimum payout: $10 equivalent (10,000 credits). Payouts processed on the 1st of each month.
          </p>
          <button
            type="submit"
            className="py-2 px-6 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors"
          >
            Request Payout
          </button>
        </form>

        <h2 className="text-xl font-semibold mb-4">Payout History</h2>
        <div className="space-y-3">
          {payouts.length === 0 ? (
            <p className="text-gray-500">No payouts yet.</p>
          ) : (
            payouts.map((p) => (
              <div key={p.id} className="bg-gray-900 rounded-lg border border-gray-800 p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">${p.amountUsd}</p>
                  <p className="text-sm text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-medium ${
                    p.status === "COMPLETED" ? "bg-emerald-900/50 text-emerald-400" :
                    p.status === "PENDING" ? "bg-yellow-900/50 text-yellow-400" :
                    "bg-red-900/50 text-red-400"
                  }`}
                >
                  {p.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
