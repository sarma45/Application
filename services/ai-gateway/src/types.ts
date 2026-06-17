export type AgentCategory = "CHAT" | "CODE" | "DATA" | "WORKFLOW";
export type ProviderName = "openrouter" | "gemini" | "openai" | "anthropic" | "deepseek" | "groq" | "cohere";

export interface ProviderRoute {
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

export interface SafetyResult {
  safe: boolean;
  reason?: string;
  score?: number;
}

export interface ExecutionLogEvent {
  agentId: string;
  userId: string;
  sessionId?: string;
  inputTokens?: number;
  outputTokens?: number;
  creditsUsed: number;
  durationMs?: number;
  status: string;
  modelUsed?: string;
  provider?: string;
  errorLog?: string;
}

export const PROVIDER_DEFAULTS: Record<ProviderName, { baseUrl: string; defaultModel: string }> = {
  openrouter: { baseUrl: "https://openrouter.ai/api/v1", defaultModel: "meta-llama/llama-4-maverick:free" },
  gemini: { baseUrl: "https://generativelanguage.googleapis.com/v1beta", defaultModel: "gemini-2.5-flash" },
  openai: { baseUrl: "https://api.openai.com/v1", defaultModel: "gpt-4o-mini" },
  anthropic: { baseUrl: "https://api.anthropic.com/v1", defaultModel: "claude-3-haiku-20240307" },
  deepseek: { baseUrl: "https://api.deepseek.com/v1", defaultModel: "deepseek-chat" },
  groq: { baseUrl: "https://api.groq.com/openai/v1", defaultModel: "llama-3.3-70b-versatile" },
  cohere: { baseUrl: "https://api.cohere.ai/v1", defaultModel: "command-r-plus" },
};
