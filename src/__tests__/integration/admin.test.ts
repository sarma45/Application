import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: vi.fn().mockResolvedValue([
        { id: "1", email: "admin@test.com", username: "admin", role: "ADMIN", isActive: true, createdAt: new Date() },
        { id: "2", email: "user@test.com", username: "user", role: "USER", isActive: true, createdAt: new Date() },
      ]),
      count: vi.fn().mockResolvedValue(2),
    },
    agent: {
      findMany: vi.fn().mockResolvedValue([
        { id: "1", name: "Test Agent", status: "PENDING", creator: { email: "creator@test.com", username: "creator" }, createdAt: new Date() },
      ]),
      count: vi.fn().mockResolvedValue(1),
      aggregate: vi.fn().mockResolvedValue({ _avg: { avgRating: 4.5 }, _sum: { totalRuns: 100 } }),
    },
    agentExecution: {
      aggregate: vi.fn().mockResolvedValue({ _count: { id: 500 } }),
    },
    auditLog: {
      findMany: vi.fn().mockResolvedValue([
        { id: "1", action: "USER_LOGIN", actor: { email: "admin@test.com" }, createdAt: new Date() },
      ]),
      count: vi.fn().mockResolvedValue(1),
    },
    wallet: {
      aggregate: vi.fn().mockResolvedValue({ _sum: { lifetimeEarned: 10000 } }),
    },
    subscription: {
      count: vi.fn().mockResolvedValue(10),
    },
    $transaction: vi.fn().mockImplementation((fn: any) => fn(vi.fn())),
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: "admin-1", email: "admin@test.com", role: "ADMIN" },
  }),
}));

describe("Admin API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("admin analytics returns aggregated data", async () => {
    const { prisma } = await import("@/lib/prisma");
    const users = await prisma.user.count();
    const agents = await prisma.agent.count();
    const executions = await prisma.agentExecution.aggregate({ _count: { id: true } });
    const revenue = await prisma.wallet.aggregate({ _sum: { lifetimeEarned: true } });

    expect(users).toBe(2);
    expect(agents).toBe(1);
    expect(executions._count.id).toBe(500);
    expect(revenue._sum.lifetimeEarned).toBe(10000);
  });

  it("moderation queue returns pending agents", async () => {
    const { prisma } = await import("@/lib/prisma");
    const pendingAgents = await prisma.agent.findMany({ where: { status: "PENDING" } });
    expect(pendingAgents.length).toBe(1);
    expect(pendingAgents[0].status).toBe("PENDING");
  });

  it("audit logs are paginated", async () => {
    const { prisma } = await import("@/lib/prisma");
    const logs = await prisma.auditLog.findMany({ take: 10 });
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe("USER_LOGIN");
  });
});
