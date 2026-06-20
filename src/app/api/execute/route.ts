import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { complete } from "@/lib/ai/gateway";
import { executeSchema } from "@/lib/validations";
import { checkSafety, sanitizeInput } from "@/lib/ai/safety";
import { logger } from "@/lib/logger";
import { unauthorized, badRequest, serverError, apiError } from "@/lib/api-helpers";
import { enqueueExecutionLog } from "@/lib/queue";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  try {
    const body = await req.json();
    const parsed = executeSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Validation failed", parsed.error.flatten().fieldErrors);
    }

    const { message, systemPrompt, category, sessionId } = parsed.data;

    const safety = await checkSafety(message, session.user.id);
    if (!safety.safe) {
      return badRequest(safety.reason || "Content policy violation");
    }

    const safeMessage = sanitizeInput(message);

    const startTime = Date.now();
    const result = await complete({
      category: category || "CHAT",
      prompt: safeMessage,
      systemPrompt: systemPrompt || "You are AIVerse, an AI assistant.",
    });

    const durationMs = Date.now() - startTime;

    enqueueExecutionLog({
      agentId: "direct-execute",
      userId: session.user.id,
      sessionId,
      inputTokens: result.usage.promptTokens,
      outputTokens: result.usage.completionTokens,
      creditsUsed: 0,
      durationMs,
      status: "COMPLETED",
      modelUsed: result.model,
      provider: result.provider,
    });

    return NextResponse.json({
      reply: result.text,
      usage: result.usage,
      provider: result.provider,
      model: result.model,
      durationMs,
    });
  } catch (error: any) {
    logger.error("execute route error", { error: String(error) });
    if (error && error.status >= 400 && error.status < 500) {
      return apiError(error.message || "Client error", "BAD_REQUEST", error.status);
    }
    return serverError();
  }
}
