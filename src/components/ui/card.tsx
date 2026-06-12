import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children }: CardProps) {
  return (
    <div className={cn("rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: CardProps) {
  return <div className={cn("px-6 py-4 border-b border-zinc-800", className)}>{children}</div>;
}

export function CardContent({ className, children }: CardProps) {
  return <div className={cn("px-6 py-4", className)}>{children}</div>;
}
