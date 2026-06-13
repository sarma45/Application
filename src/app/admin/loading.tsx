import { StatsCardSkeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="container-main py-8 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-7 w-36" />
          <div className="skeleton h-4 w-48" />
        </div>
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass glass-card p-5 space-y-3">
            <div className="skeleton h-5 w-40" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg glass p-3">
                <div className="space-y-1">
                  <div className="skeleton h-4 w-32" />
                  <div className="skeleton h-3 w-24" />
                </div>
                <div className="flex gap-2">
                  <div className="skeleton h-7 w-16 rounded" />
                  <div className="skeleton h-7 w-16 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="glass glass-card p-5 space-y-3">
            <div className="skeleton h-5 w-20" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="skeleton h-4 w-28" />
                  <div className="skeleton h-3 w-16" />
                </div>
                <div className="skeleton h-5 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
