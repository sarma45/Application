import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { complete } from '@/lib/ai/gateway';
import { chatSchema } from '@/lib/validations';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const result = await complete({
      category: 'CHAT',
      prompt: parsed.data.message,
      systemPrompt: 'You are AIVerse, an AI assistant.'
    });

    return NextResponse.json({
      reply: result.text,
      usage: result.usage,
      provider: result.provider,
      model: result.model
    });
  } catch (error) {
    console.error('chat route error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
