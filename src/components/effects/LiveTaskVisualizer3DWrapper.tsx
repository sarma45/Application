"use client";

import dynamic from "next/dynamic";

const LiveTaskVisualizer = dynamic(
  () => import("./LiveTaskVisualizer3D"),
  { ssr: false }
);

export function LiveTaskVisualizer3DWrapper() {
  return <LiveTaskVisualizer />;
}
