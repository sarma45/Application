import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/health/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
  },
}));

vi.mock("@/lib/redis", () => ({
  redis: {
    status: "ready",
    ping: vi.fn().mockResolvedValue("PONG"),
  },
}));

describe("GET /api/health", () => {
  it("should return 200 with healthy services", async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.version).toBe("2.0.0");
    expect(body.services.database).toEqual({ status: "healthy" });
    expect(body.services.redis).toEqual({ status: "healthy" });
  });

  it("should return degraded when database fails", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.$queryRaw as any).mockRejectedValueOnce(new Error("DB down"));

    const res = await GET();
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body.status).toBe("degraded");
    expect(body.services.database.status).toBe("unhealthy");
  });
});
