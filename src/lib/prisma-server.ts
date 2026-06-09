import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'test') {
  prisma.$connect().catch((error) => {
    console.error('Prisma initial connect failed:', error);
  });
}
