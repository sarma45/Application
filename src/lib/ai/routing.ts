export type AgentCategory = "CHAT" | "CODE" | "DATA" | "WORKFLOW";
export type ProviderName = "openrouter" | "gemini" | "openai" | "anthropic" | "deepseek" | "groq" | "cohere";

export interface ProviderRoute {
  provider: ProviderName;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

interface EnvConfig {
  openRouterApiKey: string;
  geminiApiKey: string;
  openaiApiKey: string;
  anthropicApiKey: string;
  deepseekApiKey: string;
  groqApiKey: string;
  cohereApiKey: string;
  geminiModel: string;
  openrouterModel: string;
  openaiModel: string;
  anthropicModel: string;
  deepseekModel: string;
  groqModel: string;
  cohereModel: string;
}

function getEnv(): EnvConfig {
  return {
    openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
    geminiApiKey: process.env.GEMINI_API_KEY || "",
    openaiApiKey: process.env.OPENAI_API_KEY || "",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
    deepseekApiKey: process.env.DEEPSEEK_API_KEY || "",
    groqApiKey: process.env.GROQ_API_KEY || "",
    cohereApiKey: process.env.COHERE_API_KEY || "",
    geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    openrouterModel: process.env.OPENROUTER_MODEL || "meta-llama/llama-4-maverick:free",
    openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
    anthropicModel: process.env.ANTHROPIC_MODEL || "claude-3-haiku-20240307",
    deepseekModel: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    cohereModel: process.env.COHERE_MODEL || "command-r-plus",
  };
}

type RouteMatrix = Record<AgentCategory, { primary: ProviderRoute; fallback?: ProviderRoute; tertiary?: ProviderRoute }>;

const apiKeyAccessor = {
  openrouter: (e: EnvConfig) => e.openRouterApiKey,
  gemini: (e: EnvConfig) => e.geminiApiKey,
  openai: (e: EnvConfig) => e.openaiApiKey,
  anthropic: (e: EnvConfig) => e.anthropicApiKey,
  deepseek: (e: EnvConfig) => e.deepseekApiKey,
  groq: (e: EnvConfig) => e.groqApiKey,
  cohere: (e: EnvConfig) => e.cohereApiKey,
} as const;

const modelAccessor = {
  openrouter: (e: EnvConfig) => e.openrouterModel,
  gemini: (e: EnvConfig) => e.geminiModel,
  openai: (e: EnvConfig) => e.openaiModel,
  anthropic: (e: EnvConfig) => e.anthropicModel,
  deepseek: (e: EnvConfig) => e.deepseekModel,
  groq: (e: EnvConfig) => e.groqModel,
  cohere: (e: EnvConfig) => e.cohereModel,
} as const;

const ROUTING_MATRIX: RouteMatrix = {
  CHAT: {
    primary: { provider: "openrouter", apiKey: "", model: "" },
    fallback: { provider: "gemini", apiKey: "", model: "" },
    tertiary: { provider: "openai", apiKey: "", model: "" },
  },
  CODE: {
    primary: { provider: "openrouter", apiKey: "", model: "" },
    fallback: { provider: "anthropic", apiKey: "", model: "" },
    tertiary: { provider: "gemini", apiKey: "", model: "" },
  },
  DATA: {
    primary: { provider: "gemini", apiKey: "", model: "" },
    fallback: { provider: "openai", apiKey: "", model: "" },
    tertiary: { provider: "deepseek", apiKey: "", model: "" },
  },
  WORKFLOW: {
    primary: { provider: "gemini", apiKey: "", model: "" },
    fallback: { provider: "openrouter", apiKey: "", model: "" },
    tertiary: { provider: "groq", apiKey: "", model: "" },
  },
};

export function getRoutesForCategory(category: AgentCategory): ProviderRoute[] {
  const env = getEnv();
  const routes = ROUTING_MATRIX[category] ?? ROUTING_MATRIX.CHAT;

  const resolved: ProviderRoute[] = [];
  const candidates = [routes.primary, routes.fallback, routes.tertiary].filter(Boolean) as ProviderRoute[];

  for (const r of candidates) {
    const getKey = apiKeyAccessor[r.provider];
    const getModel = modelAccessor[r.provider];
    const apiKey = getKey(env);
    if (!apiKey) continue;
    resolved.push({ ...r, apiKey, model: getModel(env), baseUrl: undefined });
  }

  return resolved;
}

export function getRoutesByProvider(apiKeys: Record<ProviderName, string>): ProviderRoute[] {
  const result: ProviderRoute[] = [];
  const defaults: Record<ProviderName, string> = {
    openrouter: "meta-llama/llama-4-maverick:free",
    gemini: "gemini-2.5-flash",
    openai: "gpt-4o-mini",
    anthropic: "claude-3-haiku-20240307",
    deepseek: "deepseek-chat",
    groq: "llama-3.3-70b-versatile",
    cohere: "command-r-plus",
  };

  for (const [provider, apiKey] of Object.entries(apiKeys)) {
    if (apiKey) {
      result.push({ provider: provider as ProviderName, apiKey, model: defaults[provider as ProviderName] });
    }
  }
  return result;
}
