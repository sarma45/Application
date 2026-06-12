export type AgentCategory = "CHAT" | "CODE" | "DATA" | "WORKFLOW";

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

export interface ModelConfig {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl?: string;
}

function getModelConfig(category: AgentCategory): ModelConfig {
  const env = getEnv();

  const categoryConfig: Record<AgentCategory, { primary: string; fallback?: string }> = {
    CHAT: { primary: env.openrouterModel, fallback: env.geminiModel },
    CODE: { primary: env.openrouterModel, fallback: env.geminiModel },
    DATA: { primary: env.geminiModel, fallback: env.openrouterModel },
    WORKFLOW: { primary: env.geminiModel, fallback: env.openrouterModel },
  };

  return {
    provider: "stub",
    model: "stub-model",
    apiKey: "",
    baseUrl: undefined,
  };
}

interface Env {
  openRouterApiKey: string;
  geminiApiKey: string;
  geminiModel: string;
  openrouterModel: string;
}

function getEnv(): Env {
  return {
    openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
    geminiApiKey: process.env.GEMINI_API_KEY || "",
    geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    openrouterModel: process.env.OPENROUTER_MODEL || "meta-llama/llama-4-maverick:free",
  };
}

export async function complete(opts: CompletionOptions): Promise<CompletionResult> {
  const env = getEnv();
  const { prompt, systemPrompt, category } = opts;

  const envs = getEnv();

  const providerMap: Record<AgentCategory, { primary: { key: keyof Env; baseUrl: string }; fallback?: { key: keyof Env; baseUrl: string } }> = {
    CHAT: {
      primary: { key: "openRouterApiKey", baseUrl: "https://openrouter.ai/api/v1/chat/completions" },
      fallback: { key: "geminiApiKey", baseUrl: `https://generativelanguage.googleapis.com/v1beta/models/${envs.geminiModel}:generateContent?key=${envs.geminiApiKey}` },
    },
    CODE: {
      primary: { key: "openRouterApiKey", baseUrl: "https://openrouter.ai/api/v1/chat/completions" },
      fallback: { key: "geminiApiKey", baseUrl: `https://generativelanguage.googleapis.com/v1beta/models/${envs.geminiModel}:generateContent?key=${envs.geminiApiKey}` },
    },
    DATA: {
      primary: { key: "geminiApiKey", baseUrl: `https://generativelanguage.googleapis.com/v1beta/models/${envs.geminiModel}:generateContent?key=${envs.geminiApiKey}` },
      fallback: { key: "openRouterApiKey", baseUrl: "https://openrouter.ai/api/v1/chat/completions" },
    },
    WORKFLOW: {
      primary: { key: "geminiApiKey", baseUrl: `https://generativelanguage.googleapis.com/v1beta/models/${envs.geminiModel}:generateContent?key=${envs.geminiApiKey}` },
      fallback: { key: "openRouterApiKey", baseUrl: "https://openrouter.ai/api/v1/chat/completions" },
    },
  };

  const route = providerMap[category] ?? providerMap.CHAT;
  const tried: string[] = [];
  for (const candidate of [route.primary, route.fallback].filter(Boolean) as { key: keyof Env; baseUrl: string }[]) {
    const apiKey = env[candidate.key];
    if (!apiKey) continue;
    try {
      const result = await callProvider({ baseUrl: candidate.baseUrl, apiKey, prompt, systemPrompt });
      if (result) return result;
    } catch (error) {
      tried.push(candidate.baseUrl);
      console.warn("provider failed", { url: candidate.baseUrl, error });
    }
  }

  return {
    text: "[fallback] providers configured, but no successful response yet",
    usage: { promptTokens: 0, completionTokens: 0 },
    provider: "fallback",
    model: "none",
  };
}

async function callProvider(opts: {
  baseUrl: string;
  apiKey: string;
  prompt: string;
  systemPrompt?: string;
}): Promise<CompletionResult | null> {
  const { baseUrl, apiKey, prompt, systemPrompt } = opts;

  if (baseUrl.includes("generativelanguage.googleapis.com")) {
    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: [systemPrompt, prompt].filter(Boolean).join("\n\n") }],
        },
      ],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    };

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gemini error ${res.status}: ${text}`);
    }

    const data = (await res.json()) as any;
    const output = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    return {
      text: output,
      usage: { promptTokens: 0, completionTokens: 0 },
      provider: "gemini",
      model: "unknown",
    };
  }

  const body = {
    model: process.env.OPENROUTER_MODEL || "meta-llama/llama-4-maverick:free",
    messages: [
      ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
      { role: "user", content: prompt },
    ],
    max_tokens: Number(process.env.OPENROUTER_MAX_TOKENS ?? 1024),
    temperature: Number(process.env.OPENROUTER_TEMPERATURE ?? 0.7),
  };

  const res = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as any;
  const output = data?.choices?.[0]?.message?.content ?? "";
  const usage = data?.usage
    ? { promptTokens: data.usage.prompt_tokens ?? 0, completionTokens: data.usage.completion_tokens ?? 0 }
    : { promptTokens: 0, completionTokens: 0 };

  return {
    text: output,
    usage,
    provider: "openrouter",
    model: data?.model ?? "unknown",
  };
}
