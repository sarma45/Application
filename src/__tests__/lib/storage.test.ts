import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadFile, deleteFile } from "@/lib/storage";

describe("uploadFile", () => {
  beforeEach(() => {
    delete process.env.S3_ENDPOINT;
    delete process.env.S3_ACCESS_KEY;
    delete process.env.S3_SECRET_KEY;
  });

  it("returns null when S3 is not configured", async () => {
    const result = await uploadFile("test.txt", Buffer.from("hello"), "text/plain");
    expect(result).toBeNull();
  });

  it("returns null when only partial config is set", async () => {
    process.env.S3_ENDPOINT = "http://localhost:9000";
    const result = await uploadFile("test.txt", Buffer.from("hello"), "text/plain");
    expect(result).toBeNull();
  });
});

describe("deleteFile", () => {
  beforeEach(() => {
    delete process.env.S3_ENDPOINT;
    delete process.env.S3_ACCESS_KEY;
    delete process.env.S3_SECRET_KEY;
  });

  it("returns false when S3 is not configured", async () => {
    const result = await deleteFile("test.txt");
    expect(result).toBe(false);
  });
});
