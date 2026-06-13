import { describe, it, expect, vi, beforeAll } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    wallet: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((cb: any) => cb({
      wallet: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn(),
      },
      transaction: {
        create: vi.fn(),
      },
      user: {
        update: vi.fn(),
      },
    })),
    auditLog: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  findUserByEmail,
  findUserById,
  getUserProfile,
  walletForUser,
  ensureUser,
  setUserPlan,
  debitCredits,
  creditCredits,
  audit,
} from "@/lib/db/users";

function mockTx() {
  const tx = {
    wallet: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    transaction: { create: vi.fn() },
    user: { update: vi.fn() },
  };
  (prisma.$transaction as any).mockImplementation((cb: any) => cb(tx));
  return tx;
}

describe("findUserByEmail", () => {
  it("should call prisma with correct email", async () => {
    const mockUser = { id: "1", email: "test@test.com" };
    (prisma.user.findUnique as any).mockResolvedValue(mockUser);

    const result = await findUserByEmail("test@test.com");
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "test@test.com" },
    });
    expect(result).toEqual(mockUser);
  });
});

describe("findUserById", () => {
  it("should call prisma with correct id", async () => {
    const mockUser = { id: "1", email: "test@test.com" };
    (prisma.user.findUnique as any).mockResolvedValue(mockUser);

    const result = await findUserById("1");
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "1" },
    });
    expect(result).toEqual(mockUser);
  });
});

describe("getUserProfile", () => {
  it("should return selected user fields", async () => {
    const mockUser = {
      id: "1",
      email: "test@test.com",
      username: "testuser",
      role: "USER",
      plan: "FREE",
      planExpiresAt: null,
      isActive: true,
      createdAt: new Date(),
    };
    (prisma.user.findUnique as any).mockResolvedValue(mockUser);

    const result = await getUserProfile("1");
    expect(result).toEqual(mockUser);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "1" },
      select: expect.any(Object),
    });
  });
});

describe("walletForUser", () => {
  it("should upsert wallet for user", async () => {
    const mockWallet = { userId: "1", balance: 0 };
    (prisma.wallet.upsert as any).mockResolvedValue(mockWallet);

    const result = await walletForUser("1");
    expect(prisma.wallet.upsert).toHaveBeenCalledWith({
      where: { userId: "1" },
      update: {},
      create: { userId: "1", balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 },
    });
    expect(result).toEqual(mockWallet);
  });
});

describe("ensureUser", () => {
  it("should upsert user with email", async () => {
    (prisma.user.upsert as any).mockResolvedValue({ id: "1", email: "test@test.com" });
    const result = await ensureUser({ email: "test@test.com" });
    expect(prisma.user.upsert).toHaveBeenCalledWith({
      where: { email: "test@test.com" },
      update: { username: null },
      create: { email: "test@test.com", username: undefined, role: "USER", plan: "FREE" },
    });
    expect(result).toEqual({ id: "1", email: "test@test.com" });
  });

  it("should support custom role and username", async () => {
    (prisma.user.upsert as any).mockResolvedValue({ id: "2", email: "admin@test.com" });
    await ensureUser({ email: "admin@test.com", username: "admin", role: "ADMIN" });
    expect(prisma.user.upsert).toHaveBeenCalledWith({
      where: { email: "admin@test.com" },
      update: { username: "admin" },
      create: { email: "admin@test.com", username: "admin", role: "ADMIN", plan: "FREE" },
    });
  });
});

describe("setUserPlan", () => {
  it("should update user plan", async () => {
    const mockUser = { id: "1", plan: "PRO" };
    (prisma.user.update as any).mockResolvedValue(mockUser);
    const result = await setUserPlan("1", "PRO");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: { plan: "PRO", planExpiresAt: undefined },
      select: expect.any(Object),
    });
    expect(result).toEqual(mockUser);
  });

  it("should support expiration date", async () => {
    const expiry = new Date("2026-12-31");
    (prisma.user.update as any).mockResolvedValue({ id: "1" });
    await setUserPlan("1", "BUSINESS", expiry);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: { plan: "BUSINESS", planExpiresAt: expiry },
      select: expect.any(Object),
    });
  });
});

describe("debitCredits", () => {
  it("should debit credits atomically", async () => {
    const tx = mockTx();
    tx.wallet.findUnique.mockResolvedValue({ id: "w1", balance: 100, lifetimeSpent: 50 });
    tx.wallet.update.mockResolvedValue({ id: "w1", userId: "1", balance: 80, lifetimeSpent: 70 });

    const result = await debitCredits("1", 20);

    expect(tx.wallet.findUnique).toHaveBeenCalledWith({
      where: { userId: "1", balance: { gte: 20 } },
      select: { id: true, balance: true, lifetimeSpent: true },
    });
    expect(tx.wallet.update).toHaveBeenCalledWith({
      where: { userId: "1" },
      data: { balance: { decrement: 20 }, lifetimeSpent: { increment: 20 } },
    });
    expect(tx.transaction.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: "1", type: "SPEND", amount: 20, balanceAfter: 80 }),
    }));
    expect(result.balance).toBe(80);
  });

  it("should throw on insufficient credits", async () => {
    const tx = mockTx();
    tx.wallet.findUnique.mockResolvedValue(null);

    await expect(debitCredits("1", 999)).rejects.toThrow("Insufficient credits");
    expect(tx.wallet.update).not.toHaveBeenCalled();
  });
});

describe("creditCredits", () => {
  it("should credit credits atomically via upsert", async () => {
    const tx = mockTx();
    tx.wallet.upsert.mockResolvedValue({ id: "w1", userId: "1", balance: 150, lifetimeEarned: 200 });

    const result = await creditCredits("1", 50);

    expect(tx.wallet.upsert).toHaveBeenCalledWith({
      where: { userId: "1" },
      update: { balance: { increment: 50 }, lifetimeEarned: { increment: 50 } },
      create: { userId: "1", balance: 50, lifetimeEarned: 50, lifetimeSpent: 0 },
    });
    expect(tx.transaction.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: "1", type: "EARN", amount: 50, balanceAfter: 150 }),
    }));
    expect(result.balance).toBe(150);
  });

  it("should support optional reference metadata", async () => {
    const tx = mockTx();
    tx.wallet.upsert.mockResolvedValue({ id: "w1", userId: "1", balance: 100, lifetimeEarned: 100 });

    await creditCredits("1", 30, { referenceType: "Referral", referenceId: "ref-123" });

    expect(tx.transaction.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ referenceType: "Referral", referenceId: "ref-123" }),
    }));
  });
});

describe("audit", () => {
  it("should create audit log entry", async () => {
    await audit({
      actorId: "user-1",
      action: "delete_account",
      targetType: "User",
      targetId: "user-1",
      metadata: JSON.stringify({ reason: "user request" }),
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorId: "user-1",
        action: "delete_account",
        targetType: "User",
        targetId: "user-1",
        metadata: JSON.stringify({ reason: "user request" }),
      },
    });
  });

  it("should work with minimal fields", async () => {
    await audit({ actorId: "user-1", action: "login" });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorId: "user-1",
        action: "login",
        targetType: undefined,
        targetId: undefined,
        metadata: undefined,
      },
    });
  });
});
