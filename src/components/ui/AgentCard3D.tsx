"use client";

import React, { useRef, useState, MouseEvent, useCallback, useEffect } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  velocityX: number;
  velocityY: number;
  life: number;
}

interface AgentCard3DProps {
  className?: string;
  children: React.ReactNode;
  maxTilt?: number;
  particleCount?: number;
}

export function AgentCard3D({
  className = "",
  children,
  maxTilt = 12,
  particleCount = 8,
}: AgentCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const particleIdRef = useRef(0);

  const [transformStyle, setTransformStyle] = useState("");
  const [spotlightStyle, setSpotlightStyle] = useState({ opacity: 0, left: 0, top: 0 });
  const [transitionStyle, setTransitionStyle] = useState("all 0.5s cubic-bezier(0.25, 1, 0.5, 1)");
  const [isHovered, setIsHovered] = useState(false);

  const createParticle = useCallback(
    (x: number, y: number): Particle => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.5;
      return {
        id: particleIdRef.current++,
        x,
        y,
        size: 2 + Math.random() * 4,
        opacity: 0.6 + Math.random() * 0.4,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        life: 1,
      };
    },
    []
  );

  const animateParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particlesRef.current = particlesRef.current
      .map((p) => ({
        ...p,
        x: p.x + p.velocityX,
        y: p.y + p.velocityY,
        life: p.life - 0.02,
        opacity: p.opacity * p.life,
        velocityX: p.velocityX * 0.98,
        velocityY: p.velocityY * 0.98,
      }))
      .filter((p) => p.life > 0);

    for (const p of particlesRef.current) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * p.life);
      gradient.addColorStop(0, `rgba(168, 85, 247, ${p.opacity})`);
      gradient.addColorStop(0.5, `rgba(0, 230, 204, ${p.opacity * 0.5})`);
      gradient.addColorStop(1, `rgba(168, 85, 247, 0)`);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    if (particlesRef.current.length > 0 || isHovered) {
      animFrameRef.current = requestAnimationFrame(animateParticles);
    }
  }, [isHovered]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const card = cardRef.current;
    if (!canvas || !card) return;

    const resizeCanvas = () => {
      const rect = card.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(card);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  useEffect(() => {
    if (isHovered) {
      animFrameRef.current = requestAnimationFrame(animateParticles);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isHovered, animateParticles]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normalizedX = x / width - 0.5;
    const normalizedY = y / height - 0.5;

    const rotateX = (-normalizedY * maxTilt).toFixed(2);
    const rotateY = (normalizedX * maxTilt).toFixed(2);

    setTransformStyle(
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
    );
    setTransitionStyle("transform 0.1s cubic-bezier(0.25, 1, 0.5, 1)");

    setSpotlightStyle({ opacity: 1, left: x, top: y });

    if (Math.random() > 0.6) {
      const newParticles = Array.from({ length: 2 }, () => createParticle(x, y));
      particlesRef.current = [...particlesRef.current, ...newParticles].slice(-particleCount * 3);
    }
  };

  const handleMouseEnter = () => {
    setTransitionStyle("all 0.1s cubic-bezier(0.25, 1, 0.5, 1)");
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setTransitionStyle("all 0.5s cubic-bezier(0.25, 1, 0.5, 1)");
    setTransformStyle("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setSpotlightStyle((prev) => ({ ...prev, opacity: 0 }));
    setIsHovered(false);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformStyle,
        transition: transitionStyle,
        transformStyle: "preserve-3d",
      }}
      className={`glass glass-card glass-border-gradient shimmer relative overflow-hidden transition-all duration-300 ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-10"
        style={{ width: "100%", height: "100%" }}
      />

      <div
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{
          width: "250px",
          height: "250px",
          background:
            "radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(0, 230, 204, 0.05) 50%, transparent 100%)",
          left: `${spotlightStyle.left}px`,
          top: `${spotlightStyle.top}px`,
          opacity: spotlightStyle.opacity,
          transition: "opacity 0.3s ease",
        }}
      />

      <div style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}>
        {children}
      </div>
    </div>
  );
}
