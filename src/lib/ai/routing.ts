export type AgentCategory = "CHAT" | "CODE" | "DATA" | "WORKFLOW";

export interface ProviderRoute {
  provider: "openrouter" | "gemini";
  apiKey: string;
  model: string;
}

function getEnv() {
  return {
    openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
    geminiApiKey: process.env.GEMINI_API_KEY || "",
    geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    openrouterModel: process.env.OPENROUTER_MODEL || "meta-llama/llama-4-maverick:free",
  };
}

const ROUTING_MATRIX: Record<AgentCategory, { primary: ProviderRoute; fallback?: ProviderRoute }> = {
  CHAT: {
    primary: { provider: "openrouter", apiKey: "", model: "meta-llama/llama-4-maverick:free" },
    fallback: { provider: "gemini", apiKey: "", model: "gemini-2.5-flash" },
  },
  CODE: {
    primary: { provider: "openrouter", apiKey: "", model: "meta-llama/llama-4-maverick:free" },
    fallback: { provider: "gemini", apiKey: "", model: "gemini-2.5-flash" },
  },
  DATA: {
    primary: { provider: "gemini", apiKey: "", model: "gemini-2.5-flash" },
    fallback: { provider: "openrouter", apiKey: "", model: "meta-llama/llama-4-maverick:free" },
  },
  WORKFLOW: {
    primary: { provider: "gemini", apiKey: "", model: "gemini-2.5-flash" },
    fallback: { provider: "openrouter", apiKey: "", model: "meta-llama/llama-4-maverick:free" },
  },
};

export function getRoutesForCategory(category: AgentCategory): ProviderRoute[] {
  const env = getEnv();
  const routes = ROUTING_MATRIX[category] ?? ROUTING_MATRIX.CHAT;

  const resolved: ProviderRoute[] = [];
  for (const r of [routes.primary, routes.fallback].filter(Boolean) as ProviderRoute[]) {
    const apiKey = r.provider === "openrouter" ? env.openRouterApiKey : env.geminiApiKey;
    if (!apiKey) continue;
    resolved.push({ ...r, apiKey, model: r.provider === "openrouter" ? env.openrouterModel : env.geminiModel });
  }
  return resolved;
}
