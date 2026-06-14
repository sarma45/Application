export default function AdminLoading() {
  return (
    <div className="container-main py-8 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-7 w-40 rounded" />
          <div className="skeleton h-4 w-52" />
        </div>
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass glass-card p-5 space-y-4">
            <div className="skeleton h-6 w-44" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg glass">
                <div className="space-y-1">
                  <div className="skeleton h-4 w-32" />
                  <div className="skeleton h-3 w-24" />
                </div>
                <div className="flex gap-2">
                  <div className="skeleton h-8 w-16 rounded-md" />
                  <div className="skeleton h-8 w-16 rounded-md" />
                </div>
              </div>
            ))}
          </div>
          <div className="glass glass-card p-5 space-y-4">
            <div className="skeleton h-6 w-36" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 py-2">
                <div className="skeleton h-1.5 w-1.5 rounded-full" />
                <div className="space-y-1">
                  <div className="skeleton h-4 w-48" />
                  <div className="skeleton h-3 w-36" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="glass glass-card p-5 space-y-3">
            <div className="skeleton h-6 w-20" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div className="space-y-1">
                  <div className="skeleton h-4 w-28" />
                  <div className="skeleton h-3 w-20" />
                </div>
                <div className="skeleton h-5 w-14 rounded-full" />
              </div>
            ))}
          </div>
          <div className="glass glass-card p-5 space-y-3">
            <div className="skeleton h-6 w-32" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div className="space-y-1">
                  <div className="skeleton h-4 w-24" />
                  <div className="skeleton h-3 w-20" />
                </div>
                <div className="skeleton h-6 w-12 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
