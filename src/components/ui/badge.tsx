import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "purple";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-zinc-800 text-zinc-300",
        variant === "success" && "bg-emerald-900/50 text-emerald-300",
        variant === "warning" && "bg-yellow-900/50 text-yellow-300",
        variant === "danger" && "bg-red-900/50 text-red-300",
        variant === "purple" && "bg-purple-900/50 text-purple-300",
        className,
      )}
    >
      {children}
    </span>
  );
}
