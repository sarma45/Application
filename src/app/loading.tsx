import { CardSkeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="container-main py-12 space-y-8 animate-pulse">
      <div className="text-center space-y-4">
        <div className="skeleton h-6 w-40 mx-auto rounded-full" />
        <div className="skeleton h-12 w-3/4 mx-auto rounded-lg" />
        <div className="skeleton h-5 w-1/2 mx-auto" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  );
}
