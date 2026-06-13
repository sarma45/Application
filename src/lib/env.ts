export const requiredEnv = [
  "DATABASE_URL",
  "AUTH_SECRET",
] as const;

export const warnEnv = [
  "OPENROUTER_API_KEY",
  "RESEND_API_KEY",
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

export function warnMissingServices() {
  const warnings: string[] = [];
  if (!process.env.OPENROUTER_API_KEY && !process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
    warnings.push("No AI provider API keys configured (OPENROUTER_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY)");
  }
  if (!process.env.RESEND_API_KEY) {
    warnings.push("No email provider configured (RESEND_API_KEY). Password reset and verification emails will not be sent.");
  }
  if (!process.env.STRIPE_SECRET && !process.env.RAZORPAY_KEY_ID) {
    warnings.push("No payment provider configured (STRIPE_SECRET or RAZORPAY_KEY_ID). Credit purchases will be unavailable.");
  }
  if (warnings.length > 0 && process.env.NODE_ENV !== "production") {
    console.warn("[AIVerse] Service warnings:\n  - " + warnings.join("\n  - "));
  }
}

warnMissingServices();
