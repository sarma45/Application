export const AGENT_CREDITS_PER_RUN_MAX = 1000;
export const AGENT_EXECUTION_MESSAGE_MAX_LENGTH = 50000;
export const AGENT_SYSTEM_PROMPT_MAX_LENGTH = 10000;
export const AGENT_NAME_MAX_LENGTH = 200;
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
export const MAX_WALLET_CREDIT_AMOUNT = 1000000;
export const MAX_EXECUTION_TIMEOUT_MS = 60000;

export const AVAILABLE_MODELS: { model: string; provider: string; label: string }[] = [
  { model: "meta-llama/llama-4-maverick:free", provider: "openrouter", label: "Llama 4 Maverick (Free)" },
  { model: "gemini-2.5-flash", provider: "gemini", label: "Gemini 2.5 Flash" },
  { model: "gpt-4o-mini", provider: "openai", label: "GPT-4o Mini" },
  { model: "claude-3-haiku-20240307", provider: "anthropic", label: "Claude 3 Haiku" },
  { model: "deepseek-chat", provider: "deepseek", label: "DeepSeek Chat" },
  { model: "llama-3.3-70b-versatile", provider: "groq", label: "Llama 3.3 70B (Groq)" },
  { model: "command-r-plus", provider: "cohere", label: "Command R+" },
];
