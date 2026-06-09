import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type Role = "USER" | "CREATOR" | "ADMIN" | "ENTERPRISE";
export type Plan = "FREE" | "PRO" | "CREATOR" | "BUSINESS" | "ENTERPRISE";

export async function ensureUser({
  email,
  username,
  role,
}: {
  email: string;
  username?: string;
  role?: Role;
}) {
  return prisma.user.upsert({
    where: { email },
    update: { username: username ?? null },
    create: { email, username, role: role ?? "USER", plan: "FREE" },
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

const userSelect = {
  id: true,
  email: true,
  username: true,
  role: true,
  plan: true,
  planExpiresAt: true,
  isActive: true,
  createdAt: true,
} as const;

export async function getUserProfile(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
  return user;
}

export async function setUserPlan(userId: string, plan: Plan, expiresAt?: Date) {
  return prisma.user.update({
    where: { id: userId },
    data: { plan, planExpiresAt: expiresAt ?? undefined },
    select: userSelect,
  });
}

export async function walletForUser(userId: string) {
  return prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId, balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 },
  });
}

export async function debitCredits(userId: string, amount: number) {
  return prisma.$transaction(async (txClient: Prisma.TransactionClient) => {
    const wallet = await txClient.wallet.findUnique({
      where: { userId },
      select: { id: true, balance: true, lifetimeSpent: true },
    });
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const newBalance = wallet.balance - amount;
    if (newBalance < 0) {
      throw new Error("Insufficient credits");
    }

    const updated = await txClient.wallet.update({
      where: { userId },
      data: { balance: newBalance, lifetimeSpent: wallet.lifetimeSpent + amount },
    });

    await txClient.transaction.create({
      data: {
        userId,
        type: "SPEND",
        amount,
        balanceAfter: newBalance,
        referenceType: "AgentExecution",
        referenceId: "",
      },
    });

    return updated;
  });
}

export async function creditCredits(userId: string, amount: number, meta?: { referenceType?: string; referenceId?: string }) {
  return prisma.$transaction(async (txClient: Prisma.TransactionClient) => {
    const wallet = await txClient.wallet.findUnique({
      where: { userId },
      select: { id: true, balance: true, lifetimeEarned: true },
    });
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const updated = await txClient.wallet.update({
      where: { userId },
      data: { balance: wallet.balance + amount, lifetimeEarned: wallet.lifetimeEarned + amount },
    });

    await txClient.transaction.create({
      data: {
        userId,
        type: "EARN",
        amount,
        balanceAfter: updated.balance,
        referenceType: meta?.referenceType ?? null,
        referenceId: meta?.referenceId ?? null,
      },
    });

    return updated;
  });
}

export async function audit({
  actorId,
  action,
  targetType,
  targetId,
  metadata,
}: {
  actorId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: string;
}) {
  await prisma.auditLog.create({
    data: { actorId, action, targetType, targetId, metadata },
  });
}
