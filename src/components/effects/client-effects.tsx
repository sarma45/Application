"use client";

import dynamic from "next/dynamic";

const NeuralBackground = dynamic(
  () => import("@/components/effects/neural-background").then((m) => m.NeuralBackground),
  { ssr: false }
);

const NeuralParticles = dynamic(
  () => import("@/components/effects/neural-particles").then((m) => m.NeuralParticles),
  { ssr: false }
);

const PageTransition = dynamic(
  () => import("@/components/effects/page-transition").then((m) => m.PageTransition),
  { ssr: false }
);

export function ClientEffects({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NeuralBackground />
      <NeuralParticles />
      <PageTransition>{children}</PageTransition>
    </>
  );
}
