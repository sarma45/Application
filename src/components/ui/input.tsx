import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ className, label, error, id, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-secondary">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "flex h-10 w-full rounded-lg border border-medium bg-white/5 px-3 py-2 text-sm text-theme",
          "backdrop-blur-sm placeholder:text-muted",
          "transition-all duration-300",
          "focus:outline-none focus:border-purple-500/50 focus:shadow-[0_0_15px_rgb(106_0_240_/_0.15)] focus:bg-white/8",
          "hover:border-strong",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "read-only:cursor-default read-only:opacity-70",
          error && "border-red-500/50 focus:border-red-500 focus:shadow-[0_0_15px_rgb(239_68_68_/_0.15)]",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
