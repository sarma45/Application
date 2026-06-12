import { describe, it, expect, beforeAll } from "vitest";
import { getRoutesForCategory } from "@/lib/ai/gateway";

describe("getRoutesForCategory", () => {
  beforeAll(() => {
    process.env.OPENROUTER_API_KEY = "test-openrouter-key";
    process.env.GEMINI_API_KEY = "test-gemini-key";
  });

  it("should return routes for CHAT category", () => {
    const routes = getRoutesForCategory("CHAT");
    expect(routes.length).toBeGreaterThan(0);
    expect(routes[0].provider).toBeDefined();
  });

  it("should return routes for CODE category", () => {
    const routes = getRoutesForCategory("CODE");
    expect(routes.length).toBeGreaterThan(0);
  });

  it("should return routes for DATA category", () => {
    const routes = getRoutesForCategory("DATA");
    expect(routes.length).toBeGreaterThan(0);
  });

  it("should return routes for WORKFLOW category", () => {
    const routes = getRoutesForCategory("WORKFLOW");
    expect(routes.length).toBeGreaterThan(0);
  });

  it("should include API keys in resolved routes", () => {
    const routes = getRoutesForCategory("CHAT");
    routes.forEach((route) => {
      expect(route.apiKey).toBeTruthy();
    });
  });
});
