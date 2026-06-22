"use client";

import { useEffect } from "react";
import { useMarketplaceStore, MarketplaceAgent } from "@/hooks/use-marketplace-store";

interface MarketplaceSyncProps {
  agents: MarketplaceAgent[];
}

export function MarketplaceSync({ agents }: MarketplaceSyncProps) {
  const setAgents = useMarketplaceStore((state) => state.setAgents);

  useEffect(() => {
    setAgents(agents);
    return () => {
      setAgents([]);
    };
  }, [agents, setAgents]);

  return null;
}
