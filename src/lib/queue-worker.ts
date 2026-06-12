import { Worker } from "bullmq";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { ExecutionLogJob } from "@/lib/queue";

let worker: Worker | null = null;

export function startExecutionWorker() {
  if (!redis) {
    logger.warn("Redis not configured — BullMQ worker not started");
    return;
  }

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
    { connection: redis as any, concurrency: 5 }
  );

  worker.on("completed", (job) => {
    logger.debug("Execution log completed", { jobId: job.id, agentId: job.data.agentId });
  });

  worker.on("failed", (job, err) => {
    logger.error("Execution log failed", { jobId: job?.id, error: err.message });
  });
}

export function stopExecutionWorker() {
  if (worker) {
    worker.close();
    worker = null;
  }
}
