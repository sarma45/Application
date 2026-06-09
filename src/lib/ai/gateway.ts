export type AgentCategory = "CHAT" | "CODE" | "DATA" | "WORKFLOW";

export interface CompletionOptions {
  category: AgentCategory;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
}

export async function complete(opts: CompletionOptions) {
  // Phase 0 stub: provider abstraction without external keys.
  // Wire to Gemini/OpenRouter/Claude in Phase 1.
  return {
    text: "[stub] model response would be streamed here",
    usage: { promptTokens: 0, completionTokens: 0 },
    provider: "stub",
    model: "stub-model"
  };
}
