import { describe, it, expect } from "vitest";
import { registerSchema, executeSchema, createReviewSchema, checkoutSchema } from "@/lib/validations";

describe("API Schema Integration", () => {
  describe("Registration flow", () => {
    it("should validate complete registration", () => {
      const result = registerSchema.safeParse({
        email: "creator@test.com",
        password: "SecurePass1",
        username: "creator1",
      });
      expect(result.success).toBe(true);
    });

    it("should reject registration with missing fields", () => {
      const result = registerSchema.safeParse({
        email: "test@test.com",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Agent execution flow", () => {
    it("should validate execution request", () => {
      const result = executeSchema.safeParse({
        message: "Generate a Python script",
        category: "CODE",
        systemPrompt: "You are a code generator",
      });
      expect(result.success).toBe(true);
    });

    it("should reject oversized messages", () => {
      const result = executeSchema.safeParse({
        message: "x".repeat(50001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Review creation flow", () => {
    it("should validate review submission", () => {
      const result = createReviewSchema.safeParse({
        rating: 4,
        title: "Great agent",
        body: "Very useful for my workflow",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Wallet operations", () => {
    it("should validate credit purchases", () => {
      const result = checkoutSchema.safeParse({ credits: 100 });
      expect(result.success).toBe(true);
    });

    it("should reject negative credit purchases", () => {
      const result = checkoutSchema.safeParse({ credits: -100 });
      expect(result.success).toBe(false);
    });
  });
});
