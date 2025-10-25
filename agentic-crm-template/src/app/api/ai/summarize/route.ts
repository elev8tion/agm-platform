import { NextResponse } from 'next/server';
import { aiService } from '@/lib/services/ai';

export async function POST(request: Request) {
  const body = await request.json();
  const { channelId, model } = body as { channelId: string; model?: string };

  if (!channelId) {
    return NextResponse.json({ error: 'channelId is required.' }, { status: 400 });
  }

  try {
    const text = await aiService.summarize({ channelId, model });
    return NextResponse.json({ text });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
