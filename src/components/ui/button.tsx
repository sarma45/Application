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
  const base = "inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden";

  const variants: Record<string, string> = {
    primary:
      "bg-gradient-to-r from-purple-600 to-stream-500 text-white hover:shadow-[0_0_20px_rgb(106_0_240_/_0.4)] active:scale-[0.97]",
    secondary:
      "glass glass-strong text-theme hover:bg-white/10 hover:border-stream-500/30",
    ghost:
      "text-secondary hover:text-theme hover:bg-white/5",
    destructive:
      "bg-red-600 text-white hover:bg-red-500",
  };

  const sizes: Record<string, string> = {
    sm: "h-8 px-3 text-xs rounded-md",
    md: "h-10 px-4 text-sm rounded-lg",
    lg: "h-12 px-6 text-base rounded-lg",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className ?? ""}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}
