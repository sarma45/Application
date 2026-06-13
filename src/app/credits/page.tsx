import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCredits } from "@/lib/utils";
import { CREDIT_PACKAGES } from "@/lib/stripe";

const CREDIT_PACKS = Object.entries(CREDIT_PACKAGES).map(([credits, price]) => ({
  credits: Number(credits),
  price,
  popular: Number(credits) === 1500,
}));

export default function CreditsPage() {
  return (
    <div className="container-main py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-neural)]">Buy Credits</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Credits power every agent execution on AIVerse. Purchase a pack below or{" "}
          <Link href="/pricing" className="text-purple-400 hover:text-stream-400 transition-colors">
            subscribe to a plan
          </Link>{" "}
          for recurring credits.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {CREDIT_PACKS.map((pack) => (
          <Card key={pack.credits} className={`relative p-6 ${pack.popular ? "ring-1 ring-purple-500/50" : ""}`}>
            {pack.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="purple">BEST VALUE</Badge>
              </div>
            )}
            <h2 className="text-2xl font-bold text-white mb-1 font-[family-name:var(--font-neural)]">{formatCredits(pack.credits)} Credits</h2>
            <p className="text-3xl font-bold text-stream-400 mb-4">${pack.price.toFixed(2)}</p>
            <p className="text-sm text-zinc-500 mb-6">
              ${(pack.price / pack.credits).toFixed(4)} per credit
            </p>
            <form action="/api/checkout" method="POST">
              <input type="hidden" name="credits" value={pack.credits} />
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg glass glass-strong text-white font-medium transition-all duration-300 hover:neural-glow hover:border-purple-500/40"
              >
                Buy {formatCredits(pack.credits)} Credits
              </button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
