import { Queue } from "bullmq";
import { redis } from "@/lib/redis";

let executionQueue: Queue | null = null;

function getQueue(): Queue | null {
  if (!redis) return null;
  if (!executionQueue) {
    executionQueue = new Queue("execution-log", {
      connection: redis as any,
    });
  }
  return executionQueue;
}

export interface ExecutionLogJob {
  agentId: string;
  userId: string;
  sessionId?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  creditsUsed: number;
  durationMs?: number | null;
  status: string;
  modelUsed?: string | null;
  provider?: string | null;
  errorLog?: string | null;
}

export async function enqueueExecutionLog(job: ExecutionLogJob) {
  const queue = getQueue();
  if (!queue) return;
  await queue.add("log-execution", job, {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
  });
}

let payoutQueue: Queue | null = null;

function getPayoutQueue(): Queue | null {
  if (!redis) return null;
  if (!payoutQueue) {
    payoutQueue = new Queue("payout-processing", {
      connection: redis as any,
    });
  }
  return payoutQueue;
}

export async function enqueuePayoutBatch() {
  const queue = getPayoutQueue();
  if (!queue) return;
  await queue.add("process-payouts", {}, { attempts: 3, backoff: { type: "exponential", delay: 2000 } });
}

export async function closeQueue() {
  if (executionQueue) {
    await executionQueue.close();
    executionQueue = null;
  }
  if (payoutQueue) {
    await payoutQueue.close();
    payoutQueue = null;
  }
}
