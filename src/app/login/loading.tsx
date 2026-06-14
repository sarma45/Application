import { Card } from "@/components/ui/card";

export default function LoginLoading() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 animate-pulse">
      <Card className="w-full max-w-sm">
        <div className="px-6 pt-6 pb-0 text-center space-y-3">
          <div className="mx-auto skeleton h-10 w-10 rounded-lg" />
          <div className="skeleton h-6 w-40 mx-auto" />
          <div className="skeleton h-4 w-52 mx-auto" />
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="skeleton h-4 w-12" />
            <div className="skeleton h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="skeleton h-4 w-16" />
            <div className="skeleton h-10 w-full rounded-lg" />
          </div>
          <div className="skeleton h-10 w-full rounded-lg" />
        </div>
      </Card>
    </div>
  );
}
