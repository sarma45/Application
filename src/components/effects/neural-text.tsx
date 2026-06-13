"use client";

import { useEffect, useRef } from "react";

interface NeuralTextProps {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "span" | "p";
  className?: string;
  glow?: boolean;
}

export function NeuralText({
  children,
  as: Tag = "span",
  className = "",
  glow = true,
}: NeuralTextProps) {
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!glow || !spanRef.current) return;
    const el = spanRef.current;
    let animationId: number;
    let start: number | null = null;

    function animate(ts: number) {
      if (!start) start = ts;
      const t = (ts - start) / 1000;
      const hue1 = 262 + 20 * Math.sin(t * 0.3);
      const hue2 = 180 + 20 * Math.sin(t * 0.3 + 2);
      const sat1 = 85 + 10 * Math.sin(t * 0.5);
      const sat2 = 100 + 10 * Math.sin(t * 0.5 + 1);
      el.style.background = `linear-gradient(135deg, hsl(${hue1}, ${sat1}%, 65%), hsl(${hue2}, ${sat2}%, 50%))`;
      el.style.webkitBackgroundClip = "text";
      el.style.webkitTextFillColor = "transparent";
      el.style.backgroundClip = "text";
      animationId = requestAnimationFrame(animate);
    }
    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [glow]);

  return (
    <Tag className={className}>
      <span ref={spanRef}>{children}</span>
    </Tag>
  );
}
