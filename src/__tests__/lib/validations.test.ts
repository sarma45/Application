import { describe, it, expect } from "vitest";
import {
  AGENT_CREDITS_PER_RUN_MAX,
  AGENT_EXECUTION_MESSAGE_MAX_LENGTH,
  registerSchema,
  createAgentSchema,
  updateAgentSchema,
  executeSchema,
  createReviewSchema,
} from "@/lib/validations";

describe("registerSchema", () => {
  it("should accept valid registration data", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "Password1",
      username: "testuser",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = registerSchema.safeParse({
      email: "invalid",
      password: "Password1",
    });
    expect(result.success).toBe(false);
  });

  it("should reject short password", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("should normalize email to lowercase", () => {
    const result = registerSchema.safeParse({
      email: "Test@Example.COM",
      password: "Password1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
  });
});

describe("createAgentSchema", () => {
  it("should accept valid agent data", () => {
    const result = createAgentSchema.safeParse({
      name: "Test Agent",
      category: "CHAT",
      systemPrompt: "You are a helpful assistant",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid category", () => {
    const result = createAgentSchema.safeParse({
      name: "Test Agent",
      category: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("should use defaults for optional fields", () => {
    const result = createAgentSchema.safeParse({
      name: "Test Agent",
      category: "CODE",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pricingType).toBe("FREE");
      expect(result.data.creditsPerRun).toBe(0);
    }
  });

  it("should accept the documented maximum credits per run", () => {
    const result = createAgentSchema.safeParse({
      name: "Paid Agent",
      category: "CHAT",
      pricingType: "PAID",
      creditsPerRun: AGENT_CREDITS_PER_RUN_MAX,
    });
    expect(result.success).toBe(true);
  });

  it("should reject credits per run above the documented maximum", () => {
    const result = createAgentSchema.safeParse({
      name: "Expensive Agent",
      category: "CHAT",
      pricingType: "PAID",
      creditsPerRun: AGENT_CREDITS_PER_RUN_MAX + 1,
    });
    expect(result.success).toBe(false);
  });

  it("should apply the same credits limit to updates", () => {
    const result = updateAgentSchema.safeParse({
      creditsPerRun: AGENT_CREDITS_PER_RUN_MAX + 1,
    });
    expect(result.success).toBe(false);
  });
});

describe("executeSchema", () => {
  it("should accept valid execution input", () => {
    const result = executeSchema.safeParse({
      message: "Hello, agent!",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty message", () => {
    const result = executeSchema.safeParse({
      message: "",
    });
    expect(result.success).toBe(false);
  });

  it("should accept the documented maximum message length", () => {
    const result = executeSchema.safeParse({
      message: "a".repeat(AGENT_EXECUTION_MESSAGE_MAX_LENGTH),
    });
    expect(result.success).toBe(true);
  });

  it("should reject messages above the documented maximum length", () => {
    const result = executeSchema.safeParse({
      message: "a".repeat(AGENT_EXECUTION_MESSAGE_MAX_LENGTH + 1),
    });
    expect(result.success).toBe(false);
  });
});

describe("createReviewSchema", () => {
  it("should accept valid review", () => {
    const result = createReviewSchema.safeParse({
      rating: 5,
      title: "Great agent",
      body: "Really helpful",
    });
    expect(result.success).toBe(true);
  });

  it("should reject rating out of range", () => {
    const result = createReviewSchema.safeParse({
      rating: 6,
    });
    expect(result.success).toBe(false);
  });

  it("should reject rating below 1", () => {
    const result = createReviewSchema.safeParse({
      rating: 0,
    });
    expect(result.success).toBe(false);
  });
});
