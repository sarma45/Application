import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, formatCredits } from "@/lib/utils";
import Link from "next/link";

const creditPackages = [
  { credits: 100, price: 1.99 },
  { credits: 500, price: 7.99 },
  { credits: 1500, price: 19.99 },
  { credits: 5000, price: 49.99 },
];

export default async function WalletPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const [wallet, transactions] = await Promise.all([
    prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId, balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 },
    }),
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="container-main py-8">
      <h1 className="text-2xl font-bold text-white mb-8">Wallet</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-zinc-500 mb-1">Available Balance</p>
              <p className="text-4xl font-bold text-white">{formatCredits(wallet.balance)} <span className="text-lg text-zinc-500">credits</span></p>
              <div className="flex gap-2 mt-2 text-sm text-zinc-500">
                <span>Lifetime spent: {formatCredits(wallet.lifetimeSpent)}</span>
                <span>Earned: {formatCredits(wallet.lifetimeEarned)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-zinc-100">Buy Credits</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {creditPackages.map((pkg) => (
                  <form key={pkg.credits} action="/api/checkout" method="POST">
                    <input type="hidden" name="credits" value={pkg.credits} />
                    <button
                      type="submit"
                      className="w-full p-4 rounded-lg border border-zinc-800 bg-zinc-900 hover:border-purple-500/50 transition-colors text-left group"
                    >
                      <p className="text-lg font-bold text-white">{formatCredits(pkg.credits)} credits</p>
                      <p className="text-sm text-zinc-500">${pkg.price.toFixed(2)}</p>
                      <p className="text-xs text-purple-400 group-hover:text-purple-300 mt-1">
                        ${(pkg.price / pkg.credits).toFixed(4)}/credit
                      </p>
                    </button>
                  </form>
                ))}
              </div>
              <p className="mt-4 text-xs text-zinc-600">
                Payments processed securely via Stripe. Credits are non-refundable.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-zinc-100">Transaction History</h2>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-sm text-zinc-500">No transactions yet</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-zinc-300">{tx.type}</p>
                        <p className="text-xs text-zinc-600">{formatDate(tx.createdAt)}</p>
                      </div>
                      <span className={tx.type === "SPEND" ? "text-red-400" : "text-emerald-400"}>
                        {tx.type === "SPEND" ? "-" : "+"}{formatCredits(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-zinc-100">Subscription</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400 mb-2">Current plan: <span className="text-white font-medium">{session.user.plan}</span></p>
              <Link href="/wallet">
                <Button variant="secondary" size="sm" className="w-full">Upgrade</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-zinc-200 mb-2">Credit Usage</h3>
              <p className="text-xs text-zinc-500">
                Each agent run costs a fixed number of credits based on the agent category and model used.
                Free tier users get 100 credits monthly.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
