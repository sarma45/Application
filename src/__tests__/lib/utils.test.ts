import { describe, it, expect } from "vitest";
import { cn, formatCredits, formatDate, slugify, formatDuration } from "@/lib/utils";

describe("cn", () => {
  it("should join class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should filter falsy values", () => {
    expect(cn("foo", false, null, undefined, "bar")).toBe("foo bar");
  });
});

describe("formatCredits", () => {
  it("should format numbers with locale separators", () => {
    expect(formatCredits(1000)).toBe("1,000");
  });

  it("should handle zero", () => {
    expect(formatCredits(0)).toBe("0");
  });
});

describe("slugify", () => {
  it("should convert text to slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("should remove special characters", () => {
    expect(slugify("Hello! World?")).toBe("hello-world");
  });

  it("should handle multiple spaces", () => {
    expect(slugify("hello   world")).toBe("hello-world");
  });
});

describe("formatDuration", () => {
  it("should format milliseconds", () => {
    expect(formatDuration(500)).toBe("500ms");
  });

  it("should format seconds", () => {
    expect(formatDuration(1500)).toBe("1.5s");
  });
});

describe("formatDate", () => {
  it("should format a date", () => {
    const result = formatDate("2024-01-15");
    expect(result).toContain("Jan");
    expect(result).toContain("15");
    expect(result).toContain("2024");
  });
});
