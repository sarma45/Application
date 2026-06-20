import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { complete } from '@/lib/ai/gateway';
import { chatSchema } from '@/lib/validations';
import { checkSafety, sanitizeInput } from '@/lib/ai/safety';
import { logger } from '@/lib/logger';
import { unauthorized, badRequest, serverError, apiError } from '@/lib/api-helpers';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return unauthorized();
  }

  try {
    const body = await req.json();
    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten().fieldErrors);
    }

    const safety = await checkSafety(parsed.data.message, session.user.id);
    if (!safety.safe) {
      return badRequest(safety.reason || 'Content policy violation');
    }

    const safeMessage = sanitizeInput(parsed.data.message);

    const result = await complete({
      category: 'CHAT',
      prompt: safeMessage,
      systemPrompt: 'You are AIVerse, an AI assistant.'
    });

    return NextResponse.json({
      reply: result.text,
      usage: result.usage,
      provider: result.provider,
      model: result.model
    });
  } catch (error: any) {
    logger.error('chat route error', { error: String(error) });
    if (error && error.status >= 400 && error.status < 500) {
      return apiError(error.message || 'Client error', 'BAD_REQUEST', error.status);
    }
    return serverError();
  }
}
