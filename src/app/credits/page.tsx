import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCredits } from "@/lib/utils";

const CREDIT_PACKS = [
  { credits: 100, price: 1.99, popular: false },
  { credits: 500, price: 7.99, popular: false },
  { credits: 1500, price: 19.99, popular: true },
  { credits: 5000, price: 49.99, popular: false },
  { credits: 20000, price: 149.99, popular: false },
];

export default function CreditsPage() {
  return (
    <div className="container-main py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Buy Credits</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Credits power every agent execution on AIVerse. Purchase a pack below or{" "}
          <Link href="/pricing" className="text-purple-400 hover:text-purple-300">
            subscribe to a plan
          </Link>{" "}
          for recurring credits.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {CREDIT_PACKS.map((pack) => (
          <Card key={pack.credits} className={`relative p-6 ${pack.popular ? "border-purple-500 ring-1 ring-purple-500" : ""}`}>
            {pack.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="purple">BEST VALUE</Badge>
              </div>
            )}
            <h2 className="text-2xl font-bold text-white mb-1">{formatCredits(pack.credits)} Credits</h2>
            <p className="text-3xl font-bold text-purple-400 mb-4">${pack.price.toFixed(2)}</p>
            <p className="text-sm text-zinc-500 mb-6">
              ${(pack.price / pack.credits).toFixed(4)} per credit
            </p>
            <form action="/api/checkout" method="POST">
              <input type="hidden" name="credits" value={pack.credits} />
              <button
                type="submit"
                className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition-colors text-white"
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
