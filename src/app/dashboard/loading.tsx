import { StatsCardSkeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="container-main py-8 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-7 w-36 rounded" />
          <div className="skeleton h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton h-6 w-16 rounded-full" />
          <div className="skeleton h-8 w-24 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => <StatsCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-3">
          <div className="skeleton h-6 w-24" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass glass-card p-4 space-y-2">
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-3 w-16" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <div className="skeleton h-6 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass glass-card p-4 space-y-2">
              <div className="skeleton h-4 w-40" />
              <div className="skeleton h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
