"use client";

import dynamic from "next/dynamic";
const UnifiedSceneProvider = dynamic(
  () => import("@/components/effects/UnifiedScene").then((m) => m.UnifiedSceneProvider),
  { ssr: false }
);

const PageTransition = dynamic(
  () => import("@/components/effects/page-transition").then((m) => m.PageTransition),
  { ssr: false }
);

export function ClientEffects({ children }: { children: React.ReactNode }) {
  return (
    <UnifiedSceneProvider>
      <PageTransition>{children}</PageTransition>
    </UnifiedSceneProvider>
  );
}
