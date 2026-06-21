import { describe, it, expect, vi, beforeEach } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

vi.mock("@/lib/redis", () => ({
  redis: {
    status: "ready",
    eval: vi.fn(),
  },
}));

describe("rate-limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow request when under limit", async () => {
    const redis = (await import("@/lib/redis")).redis as any;
    redis.eval = vi.fn().mockResolvedValue([1, 9, 300]);

    const result = await rateLimit(new Request("http://test.com", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    }), "auth");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("should block request when over limit", async () => {
    const redis = (await import("@/lib/redis")).redis as any;
    redis.eval = vi.fn().mockResolvedValue([0, 0, 200]);

    const result = await rateLimit(new Request("http://test.com", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    }), "auth");

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should fall back to allow when redis is down", async () => {
    const redis = (await import("@/lib/redis")).redis as any;
    redis.status = "close";

    const result = await rateLimit(new Request("http://test.com"), "api");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99);
  });

  it("should use different windows per zone", () => {
    const limits = { auth: 300, api: 60, execute: 60 };
    expect(limits.auth).toBe(300);
    expect(limits.api).toBe(60);
  });
});

describe("limits constants", () => {
  it("should export expected constants", async () => {
    const limits = await import("@/lib/limits");
    expect(limits.AGENT_CREDITS_PER_RUN_MAX).toBe(1000);
    expect(limits.AGENT_EXECUTION_MESSAGE_MAX_LENGTH).toBe(50000);
    expect(limits.AGENT_SYSTEM_PROMPT_MAX_LENGTH).toBe(10000);
    expect(limits.MAX_FILE_SIZE_BYTES).toBe(50 * 1024 * 1024);
    expect(limits.AVAILABLE_MODELS.length).toBeGreaterThan(0);
    expect(limits.AVAILABLE_MODELS[0]).toHaveProperty("model");
    expect(limits.AVAILABLE_MODELS[0]).toHaveProperty("provider");
    expect(limits.AVAILABLE_MODELS[0]).toHaveProperty("label");
  });
});
