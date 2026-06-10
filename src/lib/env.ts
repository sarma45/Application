export const requiredEnv = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "REDIS_URL",
] as const;

export type RequiredEnv = typeof requiredEnv[number];

export function assertEnv() {
  const missing: string[] = [];
  for (const key of requiredEnv) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}

export function getEnv() {
  assertEnv();
  return {
    databaseUrl: process.env.DATABASE_URL as string,
    redisUrl: process.env.REDIS_URL as string,
    authSecret: process.env.AUTH_SECRET as string,
    nodeEnv: process.env.NODE_ENV ?? "development",

    openRouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
    geminiApiKey: process.env.GEMINI_API_KEY ?? "",
    geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    openRouterModel: process.env.OPENROUTER_MODEL ?? "meta-llama/llama-4-maverick:free",
    resendApiKey: process.env.RESEND_API_KEY ?? "",
    stripeSecret: process.env.STRIPE_SECRET ?? "",
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  };
}
