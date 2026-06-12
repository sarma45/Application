import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Turnstile verification", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns true when secret key is not configured", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    const { verifyTurnstileToken } = await import("@/lib/turnstile");
    const result = await verifyTurnstileToken("any-token");
    expect(result).toBe(true);
  });

  it("returns false on failed verification", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";

    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: false }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { verifyTurnstileToken } = await import("@/lib/turnstile");
    const result = await verifyTurnstileToken("invalid-token");
    expect(result).toBe(false);
    vi.unstubAllGlobals();
  });

  it("returns true on successful verification", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";

    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true, challenge_ts: "2026-06-12T00:00:00Z" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { verifyTurnstileToken } = await import("@/lib/turnstile");
    const result = await verifyTurnstileToken("valid-token");
    expect(result).toBe(true);
    vi.unstubAllGlobals();
  });

  it("returns false on network error", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";

    const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
    vi.stubGlobal("fetch", mockFetch);

    const { verifyTurnstileToken } = await import("@/lib/turnstile");
    const result = await verifyTurnstileToken("token");
    expect(result).toBe(false);
    vi.unstubAllGlobals();
  });
});
