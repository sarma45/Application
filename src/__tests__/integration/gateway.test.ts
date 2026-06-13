import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/ai/providers", () => ({
  getProviderConfig: vi.fn((provider: string, apiKey: string, model: string) => ({
    provider,
    apiKey,
    model,
    baseUrl: `https://${provider}.example.com`,
  })),
  completeNonStreaming: vi.fn(),
  streamProvider: vi.fn(),
  getProviderForModel: vi.fn(() => "openai-compat"),
}));

import { complete, getRoutesForCategory } from "@/lib/ai/gateway";
import { completeNonStreaming } from "@/lib/ai/providers";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.OPENROUTER_API_KEY = "sk-or-test-key";
  process.env.OPENROUTER_MODEL = "test-model";
  process.env.GEMINI_API_KEY = "sk-gem-test";
  process.env.GEMINI_MODEL = "gemini-2.5-flash";
});

describe("AI Gateway", () => {
  describe("getRoutesForCategory", () => {
    it("returns routes for CHAT category", () => {
      const routes = getRoutesForCategory("CHAT");
      expect(routes.length).toBeGreaterThan(0);
      expect(routes[0].provider).toBe("openrouter");
      expect(routes[0].apiKey).toBe("sk-or-test-key");
    });

    it("returns routes for CODE category", () => {
      const routes = getRoutesForCategory("CODE");
      expect(routes.length).toBeGreaterThan(0);
      expect(routes[0].provider).toBe("openrouter");
    });

    it("returns routes for DATA category", () => {
      const routes = getRoutesForCategory("DATA");
      expect(routes.length).toBeGreaterThan(0);
      expect(routes[0].provider).toBe("gemini");
    });

    it("skips providers without API keys", () => {
      delete process.env.OPENROUTER_API_KEY;
      delete process.env.GEMINI_API_KEY;
      delete process.env.OPENAI_API_KEY;
      const routes = getRoutesForCategory("CHAT");
      expect(routes.length).toBe(0);
    });

    it("fallback to CHAT for unknown category", () => {
      const routes = getRoutesForCategory("UNKNOWN" as any);
      expect(routes.length).toBeGreaterThan(0);
      expect(routes[0].provider).toBe("openrouter");
    });
  });

  describe("complete", () => {
    it("returns text from successful provider", async () => {
      vi.mocked(completeNonStreaming).mockResolvedValueOnce({
        text: "Hello world",
        usage: { promptTokens: 10, completionTokens: 5 },
        provider: "openrouter",
        model: "test-model",
      });

      const result = await complete({
        category: "CHAT",
        prompt: "Say hello",
      });

      expect(result.text).toBe("Hello world");
      expect(result.provider).toBe("openrouter");
      expect(result.usage.promptTokens).toBe(10);
    });

    it("falls back to next provider on failure", async () => {
      vi.mocked(completeNonStreaming)
        .mockRejectedValueOnce(new Error("Provider 1 failed"))
        .mockResolvedValueOnce({
          text: "Fallback response",
          usage: { promptTokens: 5, completionTokens: 3 },
          provider: "gemini",
          model: "gemini-2.5-flash",
        });

      const result = await complete({
        category: "CHAT",
        prompt: "Hello",
      });

      expect(result.text).toBe("Fallback response");
      expect(result.provider).toBe("gemini");
    });

    it("returns fallback message when all providers fail", async () => {
      vi.mocked(completeNonStreaming).mockRejectedValue(new Error("All providers failed"));

      const result = await complete({
        category: "CHAT",
        prompt: "Hello",
      });

      expect(result.text).toBe("[fallback] all providers failed");
      expect(result.provider).toBe("fallback");
    });

    it("includes system prompt in messages", async () => {
      vi.mocked(completeNonStreaming).mockResolvedValueOnce({
        text: "Response",
        usage: { promptTokens: 20, completionTokens: 10 },
        provider: "openrouter",
        model: "test-model",
      });

      await complete({
        category: "CHAT",
        prompt: "Hello",
        systemPrompt: "Be helpful",
      });

      expect(vi.mocked(completeNonStreaming).mock.calls[0][1].messages).toContainEqual({
        role: "system",
        content: "Be helpful",
      });
    });
  });
});
