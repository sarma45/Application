import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { getRoutesForCategory } from "@/lib/ai/gateway";
import type { AgentCategory } from "@/lib/ai/gateway";
import { getProviderConfig, streamProvider } from "@/lib/ai/providers";
import type { CompletionParams } from "@/lib/ai/providers";
import { cacheDel } from "@/lib/redis";
import { executeSchema } from "@/lib/validations";
import { checkSafety, sanitizeInput } from "@/lib/ai/safety";
import { enqueueExecutionLog, enqueueAgentSwarm } from "@/lib/queue";
import { logger } from "@/lib/logger";
import { unauthorized, badRequest, forbidden, notFound, paymentRequired, serverError } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/rate-limit";
import { decryptField } from "@/lib/encryption";

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
        update: {
          balance: { increment: share },
          lifetimeEarned: { increment: share },
        },
        create: {
          userId: agentCreatorId,
          balance: share,
          lifetimeEarned: share,
          lifetimeSpent: 0,
        },
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
      await tx.creatorProfile.upsert({
        where: { userId: agentCreatorId },
        update: { totalEarned: { increment: share } },
        create: { userId: agentCreatorId, totalEarned: share },
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
    return unauthorized();
  }

  const rl = await rateLimit(req, "execute");
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Please slow down.", code: "RATE_LIMITED" }, { status: 429 });
  }

  const { slug } = await params;

  try {
    const body = await req.json();
    const parsed = executeSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Validation failed", parsed.error.flatten().fieldErrors);
    }

    const { message, systemPrompt, category, sessionId: clientSessionId, modelProvider, modelId } = parsed.data as any;

    if (clientSessionId && /[^a-zA-Z0-9\-_:]/.test(clientSessionId)) {
      return badRequest("Invalid sessionId format");
    }

    const limit = await checkFreeTierLimit(session.user.id);
    if (!limit.allowed) {
      return paymentRequired("Daily free tier limit reached. Upgrade your plan or try again tomorrow.");
    }

    const safety = await checkSafety(message, session.user.id);
    if (!safety.safe) {
      return badRequest(safety.reason || "Content policy violation");
    }

    const safeMessage = sanitizeInput(message);

    const agent = await prisma.agent.findUnique({ where: { slug } });
    if (!agent) {
      return notFound("Agent not found");
    }

    if (agent.status !== "APPROVED" && agent.creatorId !== session.user.id) {
      return forbidden("This agent is not available for execution");
    }

    const isTestMode = body._test === true && agent.creatorId === session.user.id;
    const cost = agent.pricingType === "FREE" ? 0 : agent.creditsPerRun;

    // Enforce max 5 sandbox test runs per agent per creator
    if (isTestMode) {
      const testKey = `sandbox:${agent.id}:${session.user.id}`;
      let testCount: number;
      if (redis && redis.status === "ready") {
        try {
          testCount = parseInt((await redis.get(testKey)) || "0", 10);
        } catch {
          testCount = 0;
        }
      } else {
        testCount = 0;
      }
      if (testCount >= 5) {
        return forbidden("Sandbox test limit reached (max 5). Submit for review to continue.");
      }
      // Increment test count (fire-and-forget)
      const r = redis;
      if (r && r.status === "ready") {
        r.incr(testKey).then(() => r.expire(testKey, 86400)).catch(() => {});
      }
    }

    if (!isTestMode && cost > 0) {
      const wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id }, select: { balance: true } });
      if (!wallet || Number(wallet.balance) < cost) {
        return paymentRequired("Insufficient credits. Please top up your wallet.");
      }
    }

    const decryptedSystemPrompt = decryptField(agent.systemPrompt);
    const systemPromptToUse = systemPrompt || decryptedSystemPrompt || "You are a helpful AI assistant.";
    const agentCategory: AgentCategory = (category || agent.category) as AgentCategory;

    if (agentCategory === "WORKFLOW") {
      const sessionId = clientSessionId || `${session.user.id}:${agent.id}:${Date.now()}`;
      
      // Enqueue job to Swarm Service queue
      await enqueueAgentSwarm({
        agentId: agent.id,
        userId: session.user.id,
        sessionId,
        input: safeMessage,
      });

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: "🤖 **Orchestrator**: Handing off to the Agent Swarm Execution worker...\n\n" })}\n\n`));

          if (!redis) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Redis not available to retrieve live swarm logs." })}\n\n`));
            controller.close();
            return;
          }

          // Duplicate Redis connection to use for subscription
          const subClient = redis.duplicate();
          
          try {
            await subClient.connect().catch(() => {});
            await subClient.subscribe(`swarm:${sessionId}:logs`, `swarm:${sessionId}:status`);
            
            subClient.on("message", async (channel, message) => {
              try {
                const data = JSON.parse(message);
                if (channel.endsWith(":logs")) {
                  const { agentRole, message: stepMessage } = data.payload || {};
                  
                  // Map roles to nice cyberpunk emojis
                  let emoji = "🤖";
                  if (agentRole.includes("Researcher")) emoji = "🔍";
                  else if (agentRole.includes("Coder")) emoji = "💻";
                  else if (agentRole.includes("Verifier")) emoji = "⚙️";
                  else if (agentRole.includes("System")) emoji = "⚡";

                  const formattedText = `\n**${emoji} ${agentRole}**:\n${stepMessage}\n\n`;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: formattedText })}\n\n`));
                } else if (channel.endsWith(":status")) {
                  if (data.type === "complete") {
                    const report = data.payload?.report || "";
                    const durationMs = data.payload?.durationMs || (Date.now() - startTime);
                    const executionId = `${session.user.id}:${agent.id}:${Date.now()}`;

                    // Perform billing & accounting
                    if (!isTestMode && cost > 0) {
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
                          await tx.agent.update({
                            where: { id: agent.id },
                            data: { totalRuns: { increment: 1 } },
                          });
                        });
                      } catch (deductErr) {
                        logger.error("credit deduction failed after workflow execution", { userId: session.user.id, cost, error: deductErr });
                      }
                    }

                    if (!isTestMode) {
                      await creditCreator(agent.creatorId, cost, executionId);

                      if (cost <= 0) {
                        try {
                          await prisma.agent.update({
                            where: { id: agent.id },
                            data: { totalRuns: { increment: 1 } },
                          });
                        } catch {}
                      }

                      // Save conversation history
                      await appendHistory(sessionId, { role: "user", content: safeMessage });
                      await appendHistory(sessionId, { role: "assistant", content: report });

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
                        modelUsed: "swarm-orchestration",
                        provider: "swarm",
                      });

                      await cacheDel(`agent:${slug}`);
                      if (cost > 0) await cacheDel(`wallet:${session.user.id}`);
                    }

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: `\n✅ **Swarm Verification Successful**:\n${report}\n\n` })}\n\n`));
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ sessionId, done: true })}\n\n`));
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                    
                    subClient.unsubscribe();
                    subClient.quit().catch(() => {});
                    controller.close();
                  } else if (data.type === "failed") {
                    const errorMsg = data.payload?.error || "Unknown swarm error";
                    const durationMs = Date.now() - startTime;
                    
                    if (!isTestMode) {
                      enqueueExecutionLog({
                        agentId: agent.id,
                        userId: session.user.id,
                        sessionId,
                        creditsUsed: 0,
                        durationMs,
                        status: "FAILED",
                        modelUsed: "swarm-orchestration",
                        provider: "swarm",
                        errorLog: errorMsg,
                      });
                    }

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: `\n❌ **Swarm Execution Failed**:\n${errorMsg}\n\n` })}\n\n`));
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ sessionId, done: true })}\n\n`));
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                    
                    subClient.unsubscribe();
                    subClient.quit().catch(() => {});
                    controller.close();
                  }
                }
              } catch (parseErr) {
                // skip bad JSON
              }
            });

            // Set a liveness timeout in case the swarm gets stuck (e.g. 180s)
            const timeoutId = setTimeout(() => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Swarm execution timeout reached (180s)." })}\n\n`));
              subClient.unsubscribe();
              subClient.quit().catch(() => {});
              controller.close();
            }, 180000);

            // Clean up when stream is cancelled
            req.signal.addEventListener("abort", () => {
              clearTimeout(timeoutId);
              subClient.unsubscribe();
              subClient.quit().catch(() => {});
            });

          } catch (subErr: any) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: `Failed to subscribe: ${subErr.message}` })}\n\n`));
            subClient.quit().catch(() => {});
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Use model override if provided, otherwise fall back to category routing
    const routes = modelProvider && modelId
      ? [{ provider: modelProvider as any, model: modelId, apiKey: "" }]
      : getRoutesForCategory(agentCategory);

    if (routes.length === 0) {
      return NextResponse.json({ error: "No AI providers configured", code: "NO_PROVIDERS" }, { status: 503 });
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
                await tx.agent.update({
                  where: { id: agent.id },
                  data: { totalRuns: { increment: 1 } },
                });
              });
            } catch (deductErr) {
              logger.error("credit deduction failed after execution", { userId: session.user.id, cost, error: deductErr });
            }
          }

          await creditCreator(agent.creatorId, cost, executionId);

          // Increment total runs for free agents
          if (cost <= 0) {
            try {
              await prisma.agent.update({
                where: { id: agent.id },
                data: { totalRuns: { increment: 1 } },
              });
            } catch {
              // silently fail
            }
          }

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
    return serverError();
  }
}
