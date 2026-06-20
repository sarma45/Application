import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, formatCredits } from "@/lib/utils";
import { CREDIT_PACKAGES } from "@/lib/stripe";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Wallet",
  description: "Manage your AIVerse credits and transactions",
};

const creditPackages = CREDIT_PACKAGES;

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
      <h1 className="text-2xl font-bold text-theme mb-8">Wallet</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-secondary mb-1">Available Balance</p>
              <p className="text-4xl font-bold text-theme">
                {formatCredits(Number(wallet.balance))} <span className="text-lg text-secondary font-normal">credits</span>
              </p>
              <div className="flex gap-4 mt-2">
                <span className="text-sm text-secondary">
                  Lifetime spent: <span className="text-theme font-mono">{formatCredits(Number(wallet.lifetimeSpent))}</span>
                </span>
                <span className="text-sm text-secondary">
                  Earned: <span className="text-theme font-mono">{formatCredits(Number(wallet.lifetimeEarned))}</span>
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-theme">Buy Credits</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {creditPackages.map((pkg) => (
                  <form key={pkg.credits} action="/api/checkout" method="POST">
                    <input type="hidden" name="credits" value={pkg.credits} />
                    <button
                      type="submit"
                      className="w-full p-4 rounded-lg glass border border-light hover:border-purple-500/40 transition-all duration-300 text-left group hover:shadow-[0_0_20px_rgb(106_0_240_/_0.1)]"
                    >
                      <p className="text-lg font-bold text-theme">{formatCredits(pkg.credits)} credits</p>
                      <p className="text-sm text-secondary">${(pkg.priceCents / 100).toFixed(2)}</p>
                      <p className="text-xs text-purple-400 group-hover:text-stream-400 mt-1 transition-colors">
                        ${(pkg.priceCents / 100 / pkg.credits).toFixed(4)}/credit
                      </p>
                    </button>
                  </form>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted">
                Payments processed securely via Stripe. Credits are non-refundable.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-theme">Transaction History</h2>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-sm text-secondary">No transactions yet</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-light last:border-0">
                      <div>
                        <p className="text-sm font-medium text-theme">{tx.type}</p>
                        <p className="text-xs text-muted">{formatDate(tx.createdAt)}</p>
                      </div>
                      <span className={`font-mono ${tx.type === "SPEND" ? "text-red-400" : "text-emerald-400"}`}>
                        {tx.type === "SPEND" ? "-" : "+"}{formatCredits(Number(tx.amount))}
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
              <h2 className="font-semibold text-theme">Subscription</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-secondary mb-2">Current plan: <span className="text-theme font-medium">{session.user.plan}</span></p>
              <Link href="/pricing">
                <Button variant="secondary" size="sm" className="w-full">Upgrade</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-theme mb-2">Credit Usage</h3>
              <p className="text-xs text-secondary">
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
