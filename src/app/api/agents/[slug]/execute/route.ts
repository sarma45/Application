import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { getRoutesForCategory } from "@/lib/ai/gateway";
import type { AgentCategory } from "@/lib/ai/gateway";
import { cacheDel } from "@/lib/redis";
import { executeSchema } from "@/lib/validations";
import { checkSafety, sanitizeInput } from "@/lib/ai/safety";

export const runtime = "nodejs";

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

    const { message, systemPrompt, category } = parsed.data;

    const safety = checkSafety(message);
    if (!safety.safe) {
      return NextResponse.json({ error: safety.reason }, { status: 400 });
    }

    const safeMessage = sanitizeInput(message);

    const agent = await prisma.agent.findUnique({ where: { slug } });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id } });
    const cost = agent.pricingType === "FREE" ? 0 : agent.creditsPerRun;

    if (cost > 0 && (!wallet || wallet.balance < cost)) {
      return NextResponse.json({ error: "Insufficient credits. Please top up your wallet." }, { status: 402 });
    }

    const systemPromptToUse = systemPrompt || agent.systemPrompt || "You are a helpful AI assistant.";
    const agentCategory: AgentCategory = (category || agent.category) as AgentCategory;
    const routes = getRoutesForCategory(agentCategory);

    if (routes.length === 0) {
      return NextResponse.json({ error: "No AI providers configured" }, { status: 503 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let usedModel = "";
        let usedProvider = "";

        for (const route of routes) {
          usedModel = route.model;
          usedProvider = route.provider;

          try {
            if (route.provider === "gemini") {
              const url = `https://generativelanguage.googleapis.com/v1beta/models/${route.model}:streamGenerateContent?alt=sse`;

              const payload = {
                contents: [
                  {
                    role: "user",
                    parts: [{ text: [systemPromptToUse, safeMessage].filter(Boolean).join("\n\n") }],
                  },
                ],
                generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
              };

              const res = await fetch(url, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-goog-api-key": route.apiKey,
                },
                body: JSON.stringify(payload),
              });

              if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Gemini error ${res.status}: ${errText}`);
              }

              const reader = res.body?.getReader();
              if (!reader) throw new Error("No response body from Gemini");

              const decoder = new TextDecoder();
              let buffer = "";

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                  if (line.startsWith("data: ")) {
                    const data = line.slice(6).trim();
                    if (!data || data === "[DONE]") continue;
                    try {
                      const parsed = JSON.parse(data);
                      const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                      if (text) {
                        const chunk = JSON.stringify({ text });
                        controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
                      }
                    } catch {
                      // skip
                    }
                  }
                }
              }
            } else {
              const url = "https://openrouter.ai/api/v1/chat/completions";

              const res = await fetch(url, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${route.apiKey}`,
                },
                body: JSON.stringify({
                  model: route.model,
                  messages: [
                    { role: "system", content: systemPromptToUse },
                    { role: "user", content: safeMessage },
                  ],
                  stream: true,
                  max_tokens: 2048,
                }),
              });

              if (!res.ok) {
                const errText = await res.text();
                throw new Error(`OpenRouter error ${res.status}: ${errText}`);
              }

              const reader = res.body?.getReader();
              if (!reader) throw new Error("No response body from OpenRouter");

              const decoder = new TextDecoder();
              let buffer = "";

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                  if (line.startsWith("data: ")) {
                    const data = line.slice(6).trim();
                    if (!data || data === "[DONE]") continue;
                    try {
                      const parsed = JSON.parse(data);
                      const text = parsed?.choices?.[0]?.delta?.content;
                      if (text) {
                        const chunk = JSON.stringify({ text });
                        controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
                      }
                    } catch {
                      // skip
                    }
                  }
                }
              }
            }

            // Success — break out of retry loop
            break;
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Provider failed";
            console.warn("execution route provider failed", { provider: route.provider, error: msg });
            // Continue to next fallback
            continue;
          }
        }

        if (cost > 0) {
          await prisma.$transaction(async (tx) => {
            const w = await tx.wallet.findUnique({ where: { userId: session.user.id } });
            if (w && w.balance >= cost) {
              await tx.wallet.update({
                where: { userId: session.user.id },
                data: { balance: w.balance - cost, lifetimeSpent: w.lifetimeSpent + cost },
              });
              await tx.transaction.create({
                data: {
                  userId: session.user.id,
                  type: "SPEND",
                  amount: cost,
                  balanceAfter: w.balance - cost,
                  referenceType: "AgentExecution",
                  referenceId: agent.id,
                },
              });
            }
          });
        }

        await prisma.agent.update({
          where: { id: agent.id },
          data: { totalRuns: { increment: 1 } },
        });

        await prisma.agentExecution.create({
          data: {
            agentId: agent.id,
            userId: session.user.id,
            creditsUsed: cost,
            status: "COMPLETED",
            modelUsed: usedModel || undefined,
          },
        });

        await cacheDel(`agent:${slug}`);
        if (cost > 0) await cacheDel(`wallet:${session.user.id}`);

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
    console.error("execute error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
