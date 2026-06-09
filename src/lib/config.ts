export const db = undefined as any;

export async function checkEnv() {
  const missing = {
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    AUTH_SECRET: process.env.AUTH_SECRET
  };
  return missing;
}
