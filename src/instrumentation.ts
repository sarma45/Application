import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/logger";

export async function register() {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.on("unhandledRejection", (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Redis") || msg.includes("ECONNREFUSED") || msg.includes("Connection is closed")) {
        return;
      }
      logger.error("Unhandled rejection", { error: msg });
    });
    if (process.env.OTEL_ENABLED === "true") {
      const { startTracing, shutdownTracing } = await import("@/lib/opentelemetry");
      await startTracing();

      process.on("SIGTERM", async () => {
        await shutdownTracing();
      });
    }

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

    try {
      const { startExecutionWorker } = require("@/lib/queue-worker");
      startExecutionWorker();
    } catch (e) {
      logger.warn("BullMQ worker failed to start", { error: (e as Error).message });
    }

    if (process.env.WS_ENABLED !== "false") {
      const { createServer } = await import("http");
      const { createWebSocketServer } = await import("@/lib/websocket");
      const wsPort = parseInt(process.env.WS_PORT || "3001", 10);
      const wsServer = createServer((_req, res) => {
        res.writeHead(426, { "Content-Type": "text/plain" });
        res.end("Upgrade Required");
      });
      createWebSocketServer(wsServer);
      wsServer.listen(wsPort, () => {
        logger.info(`WebSocket server listening on port ${wsPort}`);
      });
    }

  }
}
