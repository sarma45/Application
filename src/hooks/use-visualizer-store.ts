import { create } from "zustand";

export interface VisualizerStep {
  id: string;
  title: string;
  description: string;
  tool: string;
  dependsOn: string[];
  status: "pending" | "running" | "success" | "error";
  output?: string;
  error?: string;
}

interface VisualizerStore {
  isActive: boolean;
  plan: VisualizerStep[];
  activeStepId: string | null;
  setPlan: (_plan: VisualizerStep[]) => void;
  updateStep: (_stepId: string, _updates: Partial<VisualizerStep>) => void;
  setActive: (_active: boolean) => void;
  reset: () => void;
}

export const useVisualizerStore = create<VisualizerStore>((set) => ({
  isActive: false,
  plan: [],
  activeStepId: null,
  setPlan: (plan: VisualizerStep[]) => set({ plan, isActive: plan.length > 0 }),
  updateStep: (stepId: string, updates: Partial<VisualizerStep>) =>
    set((state: VisualizerStore) => ({
      plan: state.plan.map((step: VisualizerStep) =>
        step.id === stepId ? { ...step, ...updates } : step
      ),
      activeStepId: updates.status === "running" ? stepId : state.activeStepId === stepId ? null : state.activeStepId,
    })),
  setActive: (isActive: boolean) => set({ isActive }),
  reset: () => set({ plan: [], activeStepId: null, isActive: false }),
}));
