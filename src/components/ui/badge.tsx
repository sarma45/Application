interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "purple" | "cyan";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm";

  const variants: Record<string, string> = {
    default: "bg-white/5 text-zinc-300 border border-white/5",
    success: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20",
    warning: "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20",
    danger: "bg-red-500/10 text-red-300 border border-red-500/20",
    purple: "bg-purple-500/15 text-purple-300 border border-purple-500/25 neural-glow",
    cyan: "bg-stream-500/10 text-stream-300 border border-stream-500/20 neural-glow-cyan",
  };

  return (
    <span className={`${base} ${variants[variant]} ${className ?? ""}`}>
      {children}
    </span>
  );
}
