"use client";

import dynamic from "next/dynamic";

const MarketplaceScene = dynamic(
  () => import("./MarketplaceScene3D"),
  { ssr: false }
);

export function MarketplaceScene3DWrapper() {
  return <MarketplaceScene />;
}
