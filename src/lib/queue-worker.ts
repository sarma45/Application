import { Worker } from "bullmq";
import Redis from "ioredis";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { ExecutionLogJob } from "@/lib/queue";
import { redis } from "@/lib/redis";

let worker: Worker | null = null;
let flushInterval: NodeJS.Timeout | null = null;

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

// Atomically and safely flush analytics and run counters from Redis to PostgreSQL
export async function flushBuffers() {
  if (!redis || redis.status !== "ready") return;

  try {
    // 1. Bulk Flush Analytics Events
    const len = await redis.llen("analytics:buffer");
    if (len > 0) {
      const tempKey = `analytics:buffer:temp:${Date.now()}`;
      // Rename list atomically to prevent concurrent write corruption
      const renameRes = await redis.rename("analytics:buffer", tempKey).catch(() => null);
      if (renameRes === "OK") {
        const items = await redis.lrange(tempKey, 0, -1);
        await redis.del(tempKey);

        if (items.length > 0) {
          const parsedEvents = items.map((item) => {
            const parsed = JSON.parse(item);
            return {
              event: parsed.event,
              userId: parsed.userId,
              metadata: parsed.metadata,
              sessionId: parsed.sessionId,
              createdAt: parsed.createdAt ? new Date(parsed.createdAt) : new Date(),
            };
          });

          await prisma.analyticsEvent.createMany({
            data: parsedEvents,
            skipDuplicates: true,
          });
          logger.info(`Buffered analytics writes flushed: ${parsedEvents.length} events.`);
        }
      }
    }

    // 2. Aggregate Flush Agent Run Counters
    const hashExists = await redis.exists("agent:runs:buffer");
    if (hashExists) {
      // Safely fetch and clear hash using atomic Lua evaluation
      const fetchAndClearScript = `
        local data = redis.call('HGETALL', KEYS[1])
        redis.call('DEL', KEYS[1])
        return data
      `;
      const rawData = await redis.eval(fetchAndClearScript, 1, "agent:runs:buffer") as string[];
      const updates: Record<string, number> = {};
      for (let i = 0; i < rawData.length; i += 2) {
        const agentId = rawData[i];
        const increment = parseInt(rawData[i + 1] || "0", 10);
        if (agentId && increment > 0) {
          updates[agentId] = (updates[agentId] || 0) + increment;
        }
      }

      const updateKeys = Object.keys(updates);
      if (updateKeys.length > 0) {
        // Run database counters increment operations in parallel
        await Promise.all(
          updateKeys.map((agentId) =>
            prisma.agent.update({
              where: { id: agentId },
              data: { totalRuns: { increment: updates[agentId] } },
            }).catch((err) => {
              logger.error(`Failed to flush agent runs increment for agent ${agentId}`, { error: err.message });
            })
          )
        );
        logger.info(`Buffered agent run counters flushed for ${updateKeys.length} agents.`);
      }
    }
  } catch (error) {
    logger.error("Error flushing buffered writes to PostgreSQL", { error: String(error) });
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

        // Write execution trace directly as it is user-critical and queryable
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

        // Buffer analytics and counters to Redis to prevent transactional write bloat & collisions
        if (redis && redis.status === "ready") {
          const analyticsData = {
            event: "agent_execution",
            userId,
            metadata: { agentId, creditsUsed, status, modelUsed },
            sessionId,
            createdAt: new Date().toISOString(),
          };
          await redis.rpush("analytics:buffer", JSON.stringify(analyticsData));
          await redis.hincrby("agent:runs:buffer", agentId, 1);
        } else {
          // Direct write fallback if Redis is down
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
        }
      },
      { connection, concurrency: 5 }
    );

    // Set up periodic flusher interval of 10s
    if (!flushInterval) {
      flushInterval = setInterval(() => {
        flushBuffers();
      }, 10000);
    }

    worker.on("completed", (job) => {
      logger.debug("Execution log completed", { jobId: job.id, agentId: job.data.agentId });
    });

    worker.on("failed", (job, err) => {
      logger.error("Execution log failed", { jobId: job?.id, error: err.message });
    });

    // Handle process shutdown hook
    const handleShutdown = async () => {
      logger.info("Process shutting down: cleaning queue workers and flushing buffers...");
      stopExecutionWorker();
      await flushBuffers();
    };

    process.once("SIGTERM", handleShutdown);
    process.once("SIGINT", handleShutdown);

  } catch (e) {
    logger.warn("BullMQ worker creation failed", { error: (e as Error).message });
  }
}

export function stopExecutionWorker() {
  if (worker) {
    worker.close();
    worker = null;
  }
  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }
}
