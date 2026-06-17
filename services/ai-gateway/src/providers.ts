import { trace, SpanStatusCode } from "@opentelemetry/api";
import type { ProviderName, ProviderRoute, Message, CompletionResponse } from "./types.js";
import { PROVIDER_DEFAULTS } from "./types.js";

const tracer = trace.getTracer("ai-gateway");

export function getProviderConfig(provider: ProviderName, apiKey: string, model?: string): ProviderRoute {
  const defaults = PROVIDER_DEFAULTS[provider];
  return { provider, apiKey, model: model || defaults.defaultModel, baseUrl: defaults.baseUrl };
}

export async function completeNonStreaming(config: ProviderRoute, params: {
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
}): Promise<CompletionResponse> {
  return tracer.startActiveSpan(`provider.${config.provider}.complete`, async (span) => {
    span.setAttributes({
      "ai.provider": config.provider,
      "ai.model": config.model,
      "ai.message_count": params.messages.length,
    });

    try {
      let result: CompletionResponse;

      switch (config.provider) {
        case "gemini":
          result = await callGeminiNonStreaming(config, params);
          break;
        case "anthropic":
          result = await callAnthropicNonStreaming(config, params);
          break;
        case "cohere":
          result = await callCohereNonStreaming(config, params);
          break;
        default:
          result = await callOpenAICompatible(config, params);
      }

      span.setAttributes({
        "ai.prompt_tokens": result.usage.promptTokens,
        "ai.completion_tokens": result.usage.completionTokens,
        "ai.response_length": result.text.length,
      });
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

async function callOpenAICompatible(config: ProviderRoute, params: {
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
}): Promise<CompletionResponse> {
  const url = `${config.baseUrl}/chat/completions`;
  const body = {
    model: config.model,
    messages: params.messages,
    max_tokens: params.maxTokens ?? 1024,
    temperature: params.temperature ?? 0.7,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`${config.provider} error ${res.status}: ${text}`);
    (err as any).status = res.status;
    throw err;
  }

  const data = (await res.json()) as any;
  const output = data?.choices?.[0]?.message?.content ?? "";
  const usage = data?.usage
    ? { promptTokens: data.usage.prompt_tokens ?? 0, completionTokens: data.usage.completion_tokens ?? 0 }
    : { promptTokens: 0, completionTokens: 0 };

  return { text: output, usage, provider: config.provider, model: data?.model ?? config.model };
}

async function callGeminiNonStreaming(config: ProviderRoute, params: {
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
}): Promise<CompletionResponse> {
  const url = `${config.baseUrl}/models/${config.model}:generateContent`;
  const systemMsg = params.messages.find(m => m.role === "system");
  const history = params.messages.filter(m => m.role !== "system");

  const contents = history.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const payload: Record<string, unknown> = {
    contents,
    generationConfig: { temperature: params.temperature ?? 0.7, maxOutputTokens: params.maxTokens ?? 1024 },
  };
  if (systemMsg) payload.systemInstruction = { parts: [{ text: systemMsg.content }] };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": config.apiKey },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Gemini error ${res.status}: ${text}`);
    (err as any).status = res.status;
    throw err;
  }

  const data = (await res.json()) as any;
  const output = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return { text: output, usage: { promptTokens: 0, completionTokens: 0 }, provider: "gemini", model: config.model };
}

async function callAnthropicNonStreaming(config: ProviderRoute, params: {
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
}): Promise<CompletionResponse> {
  const systemMsg = params.messages.find(m => m.role === "system");
  const msgs = params.messages.filter(m => m.role !== "system").map(m => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const body: Record<string, unknown> = {
    model: config.model,
    max_tokens: params.maxTokens ?? 1024,
    messages: msgs,
  };
  if (systemMsg) body.system = systemMsg.content;

  const res = await fetch(`${config.baseUrl}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Anthropic error ${res.status}: ${text}`);
    (err as any).status = res.status;
    throw err;
  }

  const data = (await res.json()) as any;
  const output = data?.content?.[0]?.text ?? "";
  return {
    text: output,
    usage: { promptTokens: data?.usage?.input_tokens ?? 0, completionTokens: data?.usage?.output_tokens ?? 0 },
    provider: "anthropic",
    model: config.model,
  };
}

async function callCohereNonStreaming(config: ProviderRoute, params: {
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
}): Promise<CompletionResponse> {
  const body = {
    model: config.model,
    message: params.messages[params.messages.length - 1]?.content ?? "",
    chat_history: params.messages.slice(0, -1).map(m => ({
      role: m.role === "assistant" ? "CHATBOT" : "USER",
      message: m.content,
    })),
    max_tokens: params.maxTokens ?? 1024,
    temperature: params.temperature ?? 0.7,
    preamble: params.messages.find(m => m.role === "system")?.content ?? "",
  };

  const res = await fetch(`${config.baseUrl}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Cohere error ${res.status}: ${text}`);
    (err as any).status = res.status;
    throw err;
  }

  const data = (await res.json()) as any;
  const output = data?.text ?? "";
  return { text: output, usage: { promptTokens: 0, completionTokens: 0 }, provider: "cohere", model: config.model };
}
