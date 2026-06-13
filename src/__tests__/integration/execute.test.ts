import { describe, it, expect } from "vitest";
import { AGENT_EXECUTION_MESSAGE_MAX_LENGTH, executeSchema } from "@/lib/validations";

describe("Agent Execution - Schema Validation", () => {
  it("should accept valid execution input", () => {
    const result = executeSchema.safeParse({
      message: "Hello, can you help me?",
      category: "CHAT",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty message", () => {
    const result = executeSchema.safeParse({ message: "" });
    expect(result.success).toBe(false);
  });

  it("should reject message exceeding max length", () => {
    const result = executeSchema.safeParse({ message: "a".repeat(AGENT_EXECUTION_MESSAGE_MAX_LENGTH + 1) });
    expect(result.success).toBe(false);
  });

  it("should accept all valid categories", () => {
    for (const cat of ["CHAT", "CODE", "DATA", "WORKFLOW"]) {
      const result = executeSchema.safeParse({ message: "test", category: cat });
      expect(result.success).toBe(true);
    }
  });

  it("should accept optional systemPrompt", () => {
    const result = executeSchema.safeParse({
      message: "test",
      systemPrompt: "You are a helpful assistant",
    });
    expect(result.success).toBe(true);
  });

  it("should reject systemPrompt exceeding max length", () => {
    const result = executeSchema.safeParse({
      message: "test",
      systemPrompt: "a".repeat(10001),
    });
    expect(result.success).toBe(false);
  });
});
