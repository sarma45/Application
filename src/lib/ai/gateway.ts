import { trace, SpanStatusCode } from "@opentelemetry/api";
import type { AgentCategory } from "./routing";
import { logger } from "@/lib/logger";

const tracer = trace.getTracer("aiverse");

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

const AI_GATEWAY_URL = process.env.AI_GATEWAY_URL || "http://ai-gateway:4001";

export async function complete(opts: CompletionOptions): Promise<CompletionResult> {
  return tracer.startActiveSpan("gateway.complete", async (span) => {
    span.setAttributes({
      "ai.category": opts.category,
      "ai.prompt_length": opts.prompt.length,
    });

    try {
      const response = await fetch(`${AI_GATEWAY_URL}/v1/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: opts.category,
          prompt: opts.prompt,
          systemPrompt: opts.systemPrompt,
          temperature: opts.temperature,
          maxTokens: opts.maxTokens,
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        const error = await response.text();
        const err = new Error(`AI Gateway error ${response.status}: ${error}`);
        (err as any).status = response.status;
        throw err;
      }

      const result = await response.json() as CompletionResult;
      span.setAttributes({
        "ai.provider": result.provider,
        "ai.model": result.model,
        "ai.prompt_tokens": result.usage.promptTokens,
        "ai.completion_tokens": result.usage.completionTokens,
      });
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error: any) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
      logger.error("AI Gateway call failed", { error: String(error) });
      if (error && error.status >= 400 && error.status < 500) {
        throw error;
      }
      return {
        text: "[fallback] AI service unavailable",
        usage: { promptTokens: 0, completionTokens: 0 },
        provider: "fallback",
        model: "none",
      };
    } finally {
      span.end();
    }
  });
}

export { completeNonStreaming, getProviderConfig } from "./providers";
export type { ProviderName } from "./routing";
export { getRoutesForCategory } from "./routing";
export type { AgentCategory, ProviderRoute } from "./routing";
