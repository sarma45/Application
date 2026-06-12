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
    $transaction: vi.fn(),
    auditLog: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  findUserByEmail,
  findUserById,
  getUserProfile,
  walletForUser,
} from "@/lib/db/users";

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
