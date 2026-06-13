export type ProviderName = "openrouter" | "gemini" | "openai" | "anthropic" | "deepseek" | "groq" | "cohere";

export interface ProviderConfig {
  provider: ProviderName;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompletionParams {
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface CompletionResponse {
  text: string;
  usage: { promptTokens: number; completionTokens: number };
  provider: ProviderName;
  model: string;
}

export interface StreamChunk {
  text: string;
  done: boolean;
}

const PROVIDER_DEFAULTS: Record<ProviderName, { baseUrl: string; defaultModel: string }> = {
  openrouter: { baseUrl: "https://openrouter.ai/api/v1", defaultModel: "meta-llama/llama-4-maverick:free" },
  gemini: { baseUrl: "https://generativelanguage.googleapis.com/v1beta", defaultModel: "gemini-2.5-flash" },
  openai: { baseUrl: "https://api.openai.com/v1", defaultModel: "gpt-4o-mini" },
  anthropic: { baseUrl: "https://api.anthropic.com/v1", defaultModel: "claude-3-haiku-20240307" },
  deepseek: { baseUrl: "https://api.deepseek.com/v1", defaultModel: "deepseek-chat" },
  groq: { baseUrl: "https://api.groq.com/openai/v1", defaultModel: "llama-3.3-70b-versatile" },
  cohere: { baseUrl: "https://api.cohere.ai/v1", defaultModel: "command-r-plus" },
};

export function getProviderConfig(provider: ProviderName, apiKey: string, model?: string): ProviderConfig {
  const defaults = PROVIDER_DEFAULTS[provider];
  return { provider, apiKey, model: model || defaults.defaultModel, baseUrl: defaults.baseUrl };
}

export async function completeNonStreaming(config: ProviderConfig, params: CompletionParams): Promise<CompletionResponse> {
  switch (config.provider) {
    case "gemini":
      return callGeminiNonStreaming(config, params);
    case "anthropic":
      return callAnthropicNonStreaming(config, params);
    case "cohere":
      return callCohereNonStreaming(config, params);
    default:
      return callOpenAICompatible(config, params);
  }
}

async function callOpenAICompatible(config: ProviderConfig, params: CompletionParams): Promise<CompletionResponse> {
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
    throw new Error(`${config.provider} error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as any;
  const output = data?.choices?.[0]?.message?.content ?? "";
  const usage = data?.usage
    ? { promptTokens: data.usage.prompt_tokens ?? 0, completionTokens: data.usage.completion_tokens ?? 0 }
    : { promptTokens: 0, completionTokens: 0 };

  return { text: output, usage, provider: config.provider, model: data?.model ?? config.model };
}

async function callGeminiNonStreaming(config: ProviderConfig, params: CompletionParams): Promise<CompletionResponse> {
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
    throw new Error(`Gemini error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as any;
  const output = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return { text: output, usage: { promptTokens: 0, completionTokens: 0 }, provider: "gemini", model: config.model };
}

async function callAnthropicNonStreaming(config: ProviderConfig, params: CompletionParams): Promise<CompletionResponse> {
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
    throw new Error(`Anthropic error ${res.status}: ${text}`);
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

async function callCohereNonStreaming(config: ProviderConfig, params: CompletionParams): Promise<CompletionResponse> {
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
    throw new Error(`Cohere error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as any;
  const output = data?.text ?? "";
  return { text: output, usage: { promptTokens: 0, completionTokens: 0 }, provider: "cohere", model: config.model };
}

export function getProviderForModel(provider: ProviderName): "openai-compat" | "gemini" | "anthropic" | "cohere" {
  if (provider === "gemini") return "gemini";
  if (provider === "anthropic") return "anthropic";
  if (provider === "cohere") return "cohere";
  return "openai-compat";
}

async function parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (text: string) => void
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6).trim();
        if (!data || data === "[DONE]") continue;
        try {
          onChunk(data);
        } catch {
          // skip malformed chunks
        }
      }
    }
  }
}

async function streamGemini(
  config: ProviderConfig,
  params: CompletionParams,
  onChunk: (text: string) => boolean
): Promise<{ fullResponse: string; ok: boolean }> {
  const url = `${config.baseUrl}/models/${config.model}:streamGenerateContent?alt=sse`;
  const systemMsg = params.messages.find(m => m.role === "system");
  const history = params.messages.filter(m => m.role !== "system");

  const contents = history.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const payload: Record<string, unknown> = {
    contents,
    generationConfig: { temperature: params.temperature ?? 0.7, maxOutputTokens: params.maxTokens ?? 2048 },
  };
  if (systemMsg) payload.systemInstruction = { parts: [{ text: systemMsg.content }] };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": config.apiKey },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini streaming error ${res.status}: ${text}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body from Gemini");

  let fullResponse = "";
  let shouldContinue = true;

  await parseSSEStream(reader, (raw) => {
    if (!shouldContinue) return;
    try {
      const parsed = JSON.parse(raw);
      const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        fullResponse += text;
        shouldContinue = onChunk(text);
      }
    } catch {
      // skip
    }
  });

  return { fullResponse, ok: fullResponse.trim().length > 0 };
}

async function streamOpenAICompatible(
  config: ProviderConfig,
  params: CompletionParams,
  onChunk: (text: string) => boolean
): Promise<{ fullResponse: string; ok: boolean }> {
  const url = `${config.baseUrl}/chat/completions`;

  const body = {
    model: config.model,
    messages: params.messages,
    stream: true,
    max_tokens: params.maxTokens ?? 2048,
    temperature: params.temperature ?? 0.7,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${config.provider} streaming error ${res.status}: ${text}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error(`No response body from ${config.provider}`);

  let fullResponse = "";
  let shouldContinue = true;

  await parseSSEStream(reader, (raw) => {
    if (!shouldContinue) return;
    try {
      const parsed = JSON.parse(raw);
      const text = parsed?.choices?.[0]?.delta?.content || parsed?.choices?.[0]?.text;
      if (text) {
        fullResponse += text;
        shouldContinue = onChunk(text);
      }
    } catch {
      // skip
    }
  });

  return { fullResponse, ok: fullResponse.trim().length > 0 };
}

export async function streamProvider(
  config: ProviderConfig,
  params: CompletionParams,
  onChunk: (text: string) => boolean
): Promise<{ fullResponse: string; ok: boolean }> {
  const handler = getProviderForModel(config.provider);
  switch (handler) {
    case "gemini":
      return streamGemini(config, params, onChunk);
    default:
      return streamOpenAICompatible(config, params, onChunk);
  }
}
