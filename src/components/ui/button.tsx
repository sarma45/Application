import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-purple-600 text-white hover:bg-purple-500",
        variant === "secondary" && "bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
        variant === "ghost" && "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800",
        variant === "destructive" && "bg-red-600 text-white hover:bg-red-500",
        size === "sm" && "h-8 px-3 text-xs rounded-md",
        size === "md" && "h-10 px-4 text-sm rounded-lg",
        size === "lg" && "h-12 px-6 text-base rounded-lg",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
