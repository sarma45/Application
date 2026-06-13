import { getRoutesForCategory, type AgentCategory, type ProviderRoute } from "./routing";
import { completeNonStreaming, getProviderConfig, type CompletionParams } from "./providers";
export { getRoutesForCategory } from "./routing";
export type { AgentCategory, ProviderRoute } from "./routing";

export interface CompletionOptions {
  category: AgentCategory;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CompletionResult {
  text: string;
  usage: { promptTokens: number; completionTokens: number };
  provider: string;
  model: string;
}

export async function complete(opts: CompletionOptions): Promise<CompletionResult> {
  const { prompt, systemPrompt, category } = opts;
  const routes = getRoutesForCategory(category);

  const messages: CompletionParams["messages"] = [
    ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
    { role: "user" as const, content: prompt },
  ];

  for (const route of routes) {
    try {
      const config = getProviderConfig(route.provider, route.apiKey, route.model);
      const result = await completeNonStreaming(config, { messages, maxTokens: opts.maxTokens, temperature: opts.temperature });
      return result;
    } catch (error) {
      console.warn("provider failed", { provider: route.provider, error });
    }
  }

  return {
    text: "[fallback] all providers failed",
    usage: { promptTokens: 0, completionTokens: 0 },
    provider: "fallback",
    model: "none",
  };
}

export { completeNonStreaming, getProviderConfig } from "./providers";
export type { ProviderName } from "./routing";
