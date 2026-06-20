import { Queue } from "bullmq";
import { redis } from "@/lib/redis";

let executionQueue: Queue | null = null;

function getQueue(): Queue | null {
  if (!redis) return null;
  if (!executionQueue) {
    try {
      executionQueue = new Queue("execution-log", {
        connection: redis as any,
      });
    } catch {
      return null;
    }
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
  try {
    await queue.add("log-execution", job, {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
    });
  } catch {
    // silently ignore if Redis is unavailable
  }
}

let payoutQueue: Queue | null = null;

function getPayoutQueue(): Queue | null {
  if (!redis) return null;
  if (!payoutQueue) {
    try {
      payoutQueue = new Queue("payout-processing", {
        connection: redis as any,
      });
    } catch {
      return null;
    }
  }
  return payoutQueue;
}

export async function enqueuePayoutBatch() {
  const queue = getPayoutQueue();
  if (!queue) return;
  try {
    await queue.add("process-payouts", {}, { attempts: 3, backoff: { type: "exponential", delay: 2000 } });
  } catch {
    // silently ignore if Redis is unavailable
  }
}

let swarmQueue: Queue | null = null;

function getSwarmQueue(): Queue | null {
  if (!redis) return null;
  if (!swarmQueue) {
    try {
      swarmQueue = new Queue("agent-swarm-execution", {
        connection: redis as any,
      });
    } catch {
      return null;
    }
  }
  return swarmQueue;
}

export interface SwarmJob {
  agentId: string;
  userId: string;
  sessionId: string;
  input: string;
}

export async function enqueueAgentSwarm(job: SwarmJob) {
  const queue = getSwarmQueue();
  if (!queue) return;
  try {
    await queue.add("execute-swarm", job, {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    });
  } catch {
    // silently ignore if Redis is unavailable
  }
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
  if (swarmQueue) {
    await swarmQueue.close();
    swarmQueue = null;
  }
}
