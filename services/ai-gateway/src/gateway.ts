import { trace, SpanStatusCode } from "@opentelemetry/api";
import type { AgentCategory, CompletionResponse } from "./types.js";
import { getRoutesForCategory, rotateApiKey } from "./routing.js";
import { completeNonStreaming, getProviderConfig } from "./providers.js";
import { circuitBreakerWrapper } from "./circuit-breaker.js";

const tracer = trace.getTracer("ai-gateway");

export interface CompletionOptions {
  category: AgentCategory;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function complete(opts: CompletionOptions): Promise<CompletionResponse> {
  const { prompt, systemPrompt, category } = opts;

  return tracer.startActiveSpan("gateway.complete", async (span) => {
    span.setAttributes({
      "ai.category": category,
      "ai.prompt_length": prompt.length,
    });

    try {
      const routes = getRoutesForCategory(category);

      const messages = [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        { role: "user" as const, content: prompt },
      ];

      for (const route of routes) {
        try {
          const config = getProviderConfig(route.provider, route.apiKey, route.model);
          const result = await circuitBreakerWrapper(
            route.provider,
            () => completeNonStreaming(config, { messages, maxTokens: opts.maxTokens, temperature: opts.temperature }),
            async () => {
              throw new Error("Circuit breaker fallback");
            }
          );
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (error: any) {
          const status = error.status;
          if (status === 429 || status === 401 || status === 403) {
            rotateApiKey(route.provider);
          }
          if (status && status >= 400 && status < 500) {
            throw error;
          }
          console.warn(`Provider ${route.provider} failed, trying next`, { error });
        }
      }

      span.setStatus({ code: SpanStatusCode.ERROR, message: "All providers failed" });
      return {
        text: "[fallback] all providers failed",
        usage: { promptTokens: 0, completionTokens: 0 },
        provider: "fallback" as any,
        model: "none",
      };
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
      throw error;
    } finally {
      span.end();
    }
  });
}
