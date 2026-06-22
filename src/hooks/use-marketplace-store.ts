import { create } from "zustand";

export interface MarketplaceAgent {
  id: string;
  name: string;
  slug: string;
  category: string;
  totalRuns: number;
  pricingType: string;
  creditsPerRun: number;
  creator: { username: string | null };
}

interface MarketplaceStore {
  agents: MarketplaceAgent[];
  hoveredAgentId: string | null;
  selectedAgentId: string | null;
  setAgents: (_agents: MarketplaceAgent[]) => void;
  setHoveredAgentId: (_id: string | null) => void;
  setSelectedAgentId: (_id: string | null) => void;
}

export const useMarketplaceStore = create<MarketplaceStore>((set) => ({
  agents: [],
  hoveredAgentId: null,
  selectedAgentId: null,
  setAgents: (agents) => set({ agents }),
  setHoveredAgentId: (id) => set({ hoveredAgentId: id }),
  setSelectedAgentId: (id) => set({ selectedAgentId: id }),
}));
