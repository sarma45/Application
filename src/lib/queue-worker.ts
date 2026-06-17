import { Worker } from "bullmq";
import Redis from "ioredis";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { ExecutionLogJob } from "@/lib/queue";

let worker: Worker | null = null;

function createBullConnection() {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    return new Redis(url, {
      maxRetriesPerRequest: null,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });
  } catch {
    return null;
  }
}

export function startExecutionWorker() {
  const connection = createBullConnection();
  if (!connection) {
    logger.warn("Redis not configured — BullMQ worker not started");
    return;
  }

  connection.on("error", () => {});

  try {
    worker = new Worker<ExecutionLogJob>(
      "execution-log",
      async (job) => {
        const { agentId, userId, sessionId, inputTokens, outputTokens, creditsUsed, durationMs, status, modelUsed, provider, errorLog } = job.data;

        await prisma.agentExecution.create({
          data: {
            agentId,
            userId,
            sessionId,
            inputTokens,
            outputTokens,
            creditsUsed,
            durationMs,
            status,
            modelUsed,
            provider,
            errorLog,
          },
        });

        await prisma.agent.update({
          where: { id: agentId },
          data: { totalRuns: { increment: 1 } },
        });

        await prisma.analyticsEvent.create({
          data: {
            event: "agent_execution",
            userId,
            metadata: { agentId, creditsUsed, status, modelUsed },
            sessionId,
          },
        });
      },
      { connection, concurrency: 5 }
    );

    worker.on("completed", (job) => {
      logger.debug("Execution log completed", { jobId: job.id, agentId: job.data.agentId });
    });

    worker.on("failed", (job, err) => {
      logger.error("Execution log failed", { jobId: job?.id, error: err.message });
    });
  } catch (e) {
    logger.warn("BullMQ worker creation failed", { error: (e as Error).message });
  }
}

export function stopExecutionWorker() {
  if (worker) {
    worker.close();
    worker = null;
  }
}
