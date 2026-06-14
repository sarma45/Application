import { DetailCardSkeleton } from "@/components/ui/skeleton";

export default function AgentDetailLoading() {
  return (
    <div className="container-main py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <DetailCardSkeleton />
          <DetailCardSkeleton />
        </div>
        <div className="space-y-4">
          <DetailCardSkeleton />
        </div>
      </div>
    </div>
  );
}
