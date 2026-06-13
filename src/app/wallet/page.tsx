import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, formatCredits } from "@/lib/utils";
import { CREDIT_PACKAGES } from "@/lib/stripe";
import Link from "next/link";

const creditPackages = Object.entries(CREDIT_PACKAGES).map(([credits, price]) => ({
  credits: Number(credits),
  price,
}));

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
      <h1 className="text-2xl font-bold text-white mb-8 font-[family-name:var(--font-neural)]">Wallet</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-zinc-500 mb-1">Available Balance</p>
              <p className="text-4xl font-bold text-white font-[family-name:var(--font-neural)]">
                {formatCredits(wallet.balance)} <span className="text-lg text-zinc-500 font-normal">credits</span>
              </p>
              <div className="flex gap-4 mt-2">
                <span className="text-sm text-zinc-500">
                  Lifetime spent: <span className="text-zinc-300 font-mono">{formatCredits(wallet.lifetimeSpent)}</span>
                </span>
                <span className="text-sm text-zinc-500">
                  Earned: <span className="text-zinc-300 font-mono">{formatCredits(wallet.lifetimeEarned)}</span>
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-zinc-100 font-[family-name:var(--font-neural)]">Buy Credits</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {creditPackages.map((pkg) => (
                  <form key={pkg.credits} action="/api/checkout" method="POST">
                    <input type="hidden" name="credits" value={pkg.credits} />
                    <button
                      type="submit"
                      className="w-full p-4 rounded-lg glass border border-white/5 hover:border-purple-500/40 transition-all duration-300 text-left group hover:shadow-[0_0_20px_rgb(106_0_240_/_0.1)]"
                    >
                      <p className="text-lg font-bold text-white font-[family-name:var(--font-neural)]">{formatCredits(pkg.credits)} credits</p>
                      <p className="text-sm text-zinc-500">${pkg.price.toFixed(2)}</p>
                      <p className="text-xs text-purple-400 group-hover:text-stream-400 mt-1 transition-colors">
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
              <h2 className="font-semibold text-zinc-100 font-[family-name:var(--font-neural)]">Transaction History</h2>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-sm text-zinc-500">No transactions yet</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-zinc-300">{tx.type}</p>
                        <p className="text-xs text-zinc-600">{formatDate(tx.createdAt)}</p>
                      </div>
                      <span className={`font-mono ${tx.type === "SPEND" ? "text-red-400" : "text-emerald-400"}`}>
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
              <h2 className="font-semibold text-zinc-100 font-[family-name:var(--font-neural)]">Subscription</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400 mb-2">Current plan: <span className="text-white font-medium">{session.user.plan}</span></p>
              <Link href="/pricing">
                <Button variant="secondary" size="sm" className="w-full">Upgrade</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-zinc-200 mb-2 font-[family-name:var(--font-neural)]">Credit Usage</h3>
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
