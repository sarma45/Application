interface CardProps {
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Card({ className, children, style }: CardProps) {
  return (
    <div
      className={`glass glass-card glass-card-hover glass-border-gradient shimmer ${className ?? ""}`}
      style={style}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: CardProps) {
  return <div className={`px-6 py-4 border-b border-white/5 ${className ?? ""}`}>{children}</div>;
}

export function CardContent({ className, children }: CardProps) {
  return <div className={`px-6 py-4 ${className ?? ""}`}>{children}</div>;
}
