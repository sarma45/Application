"use client";

import { useRef, useEffect, useCallback } from "react";

export function useMouseParallax(factor = 0.03) {
  const ref = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);

  const handleMouse = useCallback((e: MouseEvent) => {
    if (!ref.current) return;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * factor;
      const y = (e.clientY - rect.top - rect.height / 2) * factor;
      ref.current.style.transform = `perspective(800px) rotateX(${-y}deg) rotateY(${x}deg)`;
    });
  }, [factor]);

  const reset = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("mousemove", handleMouse);
    el.addEventListener("mouseleave", reset);
    return () => {
      el.removeEventListener("mousemove", handleMouse);
      el.removeEventListener("mouseleave", reset);
      cancelAnimationFrame(frameRef.current);
    };
  }, [handleMouse, reset]);

  return ref;
}
