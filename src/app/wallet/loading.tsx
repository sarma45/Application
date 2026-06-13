export default function WalletLoading() {
  return (
    <div className="container-main py-8 space-y-6 animate-pulse">
      <div className="skeleton h-7 w-32" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass glass-card p-6 space-y-3">
            <div className="skeleton h-4 w-28" />
            <div className="skeleton h-9 w-48" />
          </div>
          <div className="glass glass-card space-y-4">
            <div className="px-6 pt-4">
              <div className="skeleton h-5 w-24" />
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="glass rounded-lg p-4 space-y-1">
                    <div className="skeleton h-5 w-24" />
                    <div className="skeleton h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="glass glass-card p-6 space-y-3">
            <div className="skeleton h-5 w-24" />
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-8 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
