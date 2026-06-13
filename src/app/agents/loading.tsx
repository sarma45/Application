import { CardSkeleton } from "@/components/ui/skeleton";

export default function AgentsLoading() {
  return (
    <div className="container-main py-8 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-7 w-40 rounded" />
          <div className="skeleton h-4 w-24" />
        </div>
        <div className="skeleton h-10 w-36 rounded-lg" />
      </div>
      <div className="skeleton h-10 w-full rounded-lg" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-6 w-16 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  );
}
