import { getRoutesForCategory, type AgentCategory, type ProviderRoute } from "./routing";
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

  for (const route of routes) {
    try {
      const result = await callProvider({ route, prompt, systemPrompt });
      if (result) return result;
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

export async function callProvider(opts: {
  route: ProviderRoute;
  prompt: string;
  systemPrompt?: string;
}): Promise<CompletionResult | null> {
  const { route, prompt, systemPrompt } = opts;

  if (route.provider === "gemini") {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${route.model}:generateContent`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: [systemPrompt, prompt].filter(Boolean).join("\n\n") }],
        },
      ],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": route.apiKey,
      },
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
      model: route.model,
    };
  }

  const url = "https://openrouter.ai/api/v1/chat/completions";

  const body = {
    model: route.model,
    messages: [
      ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
      { role: "user", content: prompt },
    ],
    max_tokens: 1024,
    temperature: 0.7,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${route.apiKey}` },
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
    model: data?.model ?? route.model,
  };
}
