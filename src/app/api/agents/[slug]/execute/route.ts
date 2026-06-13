import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { getRoutesForCategory } from "@/lib/ai/gateway";
import type { AgentCategory } from "@/lib/ai/gateway";
import { getProviderConfig, streamProvider } from "@/lib/ai/providers";
import type { CompletionParams, ProviderConfig } from "@/lib/ai/providers";
import { cacheDel } from "@/lib/redis";
import { executeSchema } from "@/lib/validations";
import { checkSafety, sanitizeInput } from "@/lib/ai/safety";
import { enqueueExecutionLog } from "@/lib/queue";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const FREE_TIER_DAILY_LIMIT = 10;
const MAX_HISTORY_TURNS = 50;
const HISTORY_TTL = 86400;

function historyKey(sessionId: string): string {
  return `chat:session:${sessionId}`;
}

async function loadHistory(sessionId: string): Promise<{ role: string; content: string }[]> {
  if (!redis || redis.status !== "ready") return [];
  try {
    const data = await redis.get(historyKey(sessionId));
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function appendHistory(sessionId: string, entry: { role: string; content: string }) {
  if (!redis || redis.status !== "ready") return;
  try {
    const history = await loadHistory(sessionId);
    history.push(entry);
    if (history.length > MAX_HISTORY_TURNS) {
      history.splice(0, history.length - MAX_HISTORY_TURNS);
    }
    await redis.setex(historyKey(sessionId), HISTORY_TTL, JSON.stringify(history));
  } catch {
    // silently fail
  }
}

async function checkFreeTierLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  if (!user || user.plan !== "FREE") {
    return { allowed: true, remaining: Infinity };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const key = `free:daily:${userId}:${today.getTime()}`;

  if (redis && redis.status === "ready") {
    try {
      const count = await redis.get(key);
      const current = count ? parseInt(count, 10) : 0;
      if (current >= FREE_TIER_DAILY_LIMIT) {
        return { allowed: false, remaining: 0 };
      }
      return { allowed: true, remaining: FREE_TIER_DAILY_LIMIT - current };
    } catch {
      // fall through
    }
  }

  const executionsToday = await prisma.agentExecution.count({
    where: { userId, createdAt: { gte: today } },
  });
  if (executionsToday >= FREE_TIER_DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: FREE_TIER_DAILY_LIMIT - executionsToday };
}

async function incrementFreeTierCounter(userId: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const key = `free:daily:${userId}:${today.getTime()}`;
  if (redis && redis.status === "ready") {
    try {
      const multi = redis.multi();
      multi.incr(key);
      multi.expire(key, 86400);
      await multi.exec();
    } catch {
      // silently fail
    }
  }
}

async function creditCreator(agentCreatorId: string, cost: number, executionId: string) {
  if (cost <= 0) return;
  const share = Math.round(cost * 0.8);
  if (share <= 0) return;
  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.wallet.upsert({
        where: { userId: agentCreatorId },
        update: { balance: { increment: share }, lifetimeEarned: { increment: share } },
        create: { userId: agentCreatorId, balance: share, lifetimeEarned: share, lifetimeSpent: 0 },
      });
      await tx.transaction.create({
        data: {
          userId: agentCreatorId,
          type: "EARN",
          amount: share,
          balanceAfter: updated.balance,
          referenceType: "AgentExecution",
          referenceId: executionId,
        },
      });
    });
    await cacheDel(`wallet:${agentCreatorId}`);
  } catch (err) {
    logger.error("Failed to credit creator", { agentCreatorId, cost, error: err });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const body = await req.json();
    const parsed = executeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { message, systemPrompt, category, sessionId: clientSessionId } = parsed.data as any;

    const limit = await checkFreeTierLimit(session.user.id);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Daily free tier limit reached. Upgrade your plan or try again tomorrow." },
        { status: 402 }
      );
    }

    const safety = await checkSafety(message, session.user.id);
    if (!safety.safe) {
      return NextResponse.json({ error: safety.reason }, { status: 400 });
    }

    const safeMessage = sanitizeInput(message);

    const agent = await prisma.agent.findUnique({ where: { slug } });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (agent.status !== "APPROVED" && agent.creatorId !== session.user.id) {
      return NextResponse.json({ error: "This agent is not available for execution" }, { status: 403 });
    }

    const isTestMode = body._test === true && agent.creatorId === session.user.id;
    const cost = agent.pricingType === "FREE" ? 0 : agent.creditsPerRun;

    if (!isTestMode && cost > 0) {
      const wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id }, select: { balance: true } });
      if (!wallet || wallet.balance < cost) {
        return NextResponse.json({ error: "Insufficient credits. Please top up your wallet." }, { status: 402 });
      }
    }

    const systemPromptToUse = systemPrompt || agent.systemPrompt || "You are a helpful AI assistant.";
    const agentCategory: AgentCategory = (category || agent.category) as AgentCategory;
    const routes = getRoutesForCategory(agentCategory);

    if (routes.length === 0) {
      return NextResponse.json({ error: "No AI providers configured" }, { status: 503 });
    }

    // Build conversation history
    const sessionId = clientSessionId || `${session.user.id}:${agent.id}:${Date.now()}`;
    const history = await loadHistory(sessionId);

    let fullResponse = "";
    let usedModel = "";
    let usedProvider = "";
    let executionSucceeded = false;
    const startTime = Date.now();

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for (const route of routes) {
          usedModel = route.model;
          usedProvider = route.provider;

          try {
            const config = getProviderConfig(route.provider, route.apiKey, route.model);
            const messages: CompletionParams["messages"] = [
              { role: "system", content: systemPromptToUse },
              ...history.map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
              { role: "user", content: safeMessage },
            ];

            const { ok: succeeded } = await streamProvider(
              config,
              { messages, maxTokens: 2048, temperature: 0.7 },
              (text: string) => {
                fullResponse += text;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                return true;
              }
            );

            if (!succeeded) {
              throw new Error("Empty response from provider");
            }

            executionSucceeded = true;
            break;
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Provider failed";
            logger.warn("execution route provider failed", { provider: route.provider, error: msg });
            continue;
          }
        }

        if (!fullResponse.trim()) {
          executionSucceeded = false;
        }

        if (executionSucceeded && !isTestMode) {
          const durationMs = Date.now() - startTime;
          const executionId = `${session.user.id}:${agent.id}:${Date.now()}`;

          if (cost > 0) {
            try {
              await prisma.$transaction(async (tx) => {
                const updated = await tx.wallet.update({
                  where: { userId: session.user.id, balance: { gte: cost } },
                  data: { balance: { decrement: cost }, lifetimeSpent: { increment: cost } },
                });
                await tx.transaction.create({
                  data: {
                    userId: session.user.id,
                    type: "SPEND",
                    amount: cost,
                    balanceAfter: updated.balance,
                    referenceType: "AgentExecution",
                    referenceId: executionId,
                  },
                });
              });
            } catch (deductErr) {
              logger.error("credit deduction failed after execution", { userId: session.user.id, cost, error: deductErr });
            }
          }

          await creditCreator(agent.creatorId, cost, executionId);

          // Save conversation history
          await appendHistory(sessionId, { role: "user", content: safeMessage });
          await appendHistory(sessionId, { role: "assistant", content: fullResponse });

          // Increment free tier counter atomically
          await incrementFreeTierCounter(session.user.id);

          // Queue async execution log
          enqueueExecutionLog({
            agentId: agent.id,
            userId: session.user.id,
            sessionId,
            creditsUsed: cost,
            durationMs,
            status: "COMPLETED",
            modelUsed: usedModel || undefined,
            provider: usedProvider || undefined,
          });

          await cacheDel(`agent:${slug}`);
          if (cost > 0) await cacheDel(`wallet:${session.user.id}`);
        }

        if (!executionSucceeded) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "All AI providers failed. No credits were charged." })}\n\n`));
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ sessionId, done: true })}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    logger.error("execute error", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
