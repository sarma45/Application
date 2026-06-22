import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrisma(): PrismaClient {
  const poolUrl = process.env.DATABASE_POOL_URL || process.env.DATABASE_URL;

  if (!poolUrl) {
    throw new Error("DATABASE_URL or DATABASE_POOL_URL environment variable is missing");
  }

  const pool = new pg.Pool({ connectionString: poolUrl });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    adapter,
  });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
