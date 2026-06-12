import { describe, it, expect } from "vitest";
import {
  registerSchema,
  createAgentSchema,
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
