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
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          text: "Hello world",
          usage: { promptTokens: 10, completionTokens: 5 },
          provider: "openrouter",
          model: "test-model",
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const result = await complete({
        category: "CHAT",
        prompt: "Say hello",
      });

      expect(result.text).toBe("Hello world");
      expect(result.provider).toBe("openrouter");
      expect(result.usage.promptTokens).toBe(10);
      vi.unstubAllGlobals();
    });

    it("returns response from gateway fallback", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          text: "Fallback response",
          usage: { promptTokens: 5, completionTokens: 3 },
          provider: "gemini",
          model: "gemini-2.5-flash",
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const result = await complete({
        category: "CHAT",
        prompt: "Hello",
      });

      expect(result.text).toBe("Fallback response");
      expect(result.provider).toBe("gemini");
      vi.unstubAllGlobals();
    });

    it("returns fallback message when gateway is unavailable", async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error("Fetch failed"));
      vi.stubGlobal("fetch", mockFetch);

      const result = await complete({
        category: "CHAT",
        prompt: "Hello",
      });

      expect(result.text).toBe("[fallback] AI service unavailable");
      expect(result.provider).toBe("fallback");
      vi.unstubAllGlobals();
    });

    it("includes system prompt in request payload", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          text: "Response",
          usage: { promptTokens: 20, completionTokens: 10 },
          provider: "openrouter",
          model: "test-model",
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      await complete({
        category: "CHAT",
        prompt: "Hello",
        systemPrompt: "Be helpful",
      });

      const fetchCallArgs = mockFetch.mock.calls[0][1] as RequestInit;
      const body = JSON.parse(fetchCallArgs.body as string);
      expect(body.systemPrompt).toBe("Be helpful");
      expect(body.prompt).toBe("Hello");
      vi.unstubAllGlobals();
    });
  });
});
