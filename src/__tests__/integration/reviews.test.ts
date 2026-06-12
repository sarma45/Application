import { describe, it, expect } from "vitest";
import { createReviewSchema } from "@/lib/validations";

describe("Review API - Schema Validation", () => {
  it("should accept valid review input", () => {
    const result = createReviewSchema.safeParse({
      rating: 4,
      title: "Great agent",
      body: "This agent really helped me with my task",
    });
    expect(result.success).toBe(true);
  });

  it("should reject rating below 1", () => {
    const result = createReviewSchema.safeParse({ rating: 0 });
    expect(result.success).toBe(false);
  });

  it("should reject rating above 5", () => {
    const result = createReviewSchema.safeParse({ rating: 6 });
    expect(result.success).toBe(false);
  });

  it("should accept minimal review with just rating", () => {
    const result = createReviewSchema.safeParse({ rating: 3 });
    expect(result.success).toBe(true);
  });

  it("should reject non-integer rating", () => {
    const result = createReviewSchema.safeParse({ rating: 3.5 });
    expect(result.success).toBe(false);
  });
});
