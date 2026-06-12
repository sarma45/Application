import Link from "next/link";

const CREDIT_PACKS = [
  { credits: 100, price: 1.99, popular: false },
  { credits: 500, price: 7.99, popular: false },
  { credits: 1500, price: 19.99, popular: true },
  { credits: 5000, price: 49.99, popular: false },
  { credits: 20000, price: 149.99, popular: false },
];

export default function CreditsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Buy Credits</h1>
        <p className="text-gray-400 mb-8">
          Credits power every agent execution on AIVerse. Purchase a pack below or{" "}
          <Link href="/pricing" className="text-cyan-400 hover:underline">
            subscribe to a plan
          </Link>{" "}
          for recurring credits.
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.credits}
              className={`relative rounded-xl border p-6 ${
                pack.popular
                  ? "border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500"
                  : "border-gray-800 bg-gray-900"
              }`}
            >
              {pack.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-600 text-xs font-bold px-3 py-1 rounded-full">
                  BEST VALUE
                </span>
              )}
              <h2 className="text-2xl font-bold mb-1">{pack.credits.toLocaleString()} Credits</h2>
              <p className="text-3xl font-bold text-cyan-400 mb-4">${pack.price.toFixed(2)}</p>
              <p className="text-sm text-gray-400 mb-6">
                ${(pack.price / pack.credits).toFixed(4)} per credit
              </p>
              <form action="/api/checkout" method="POST">
                <input type="hidden" name="credits" value={pack.credits} />
                <input type="hidden" name="price" value={pack.price} />
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-medium transition-colors"
                >
                  Buy {pack.credits.toLocaleString()} Credits
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
