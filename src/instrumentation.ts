import * as Sentry from "@sentry/nextjs";

export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.SENTRY_DSN) {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || "development",
        tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
        integrations: [
          Sentry.prismaIntegration(),
        ],
      });
    }
    const { startExecutionWorker } = require("@/lib/queue-worker");
    startExecutionWorker();
  }
}
