import * as Sentry from "@sentry/nextjs";
import { logger } from "./logger";

export async function captureError(error: unknown, context?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(message, { error, ...context });

  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
}

export function setSentryUser(userId: string | undefined) {
  if (userId && process.env.SENTRY_DSN) {
    Sentry.setUser({ id: userId });
  }
}
