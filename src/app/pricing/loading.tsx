import { CardSkeleton } from "@/components/ui/skeleton";

export default function PricingLoading() {
  return (
    <div className="container-main py-16 space-y-8 animate-pulse">
      <div className="text-center space-y-4">
        <div className="skeleton h-6 w-20 mx-auto rounded-full" />
        <div className="skeleton h-10 w-96 mx-auto rounded-lg" />
        <div className="skeleton h-5 w-64 mx-auto" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass glass-card p-6 space-y-4">
            <div className="space-y-2">
              <div className="skeleton h-5 w-16" />
              <div className="skeleton h-8 w-24" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="skeleton h-4 w-full" />
              ))}
            </div>
            <div className="skeleton h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
