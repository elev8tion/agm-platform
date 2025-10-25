import { NextResponse } from 'next/server';
import { aiService } from '@/lib/services/ai';

export async function POST(request: Request) {
  const body = await request.json();
  const { channelId, prompt, model, context } = body as {
    channelId: string;
    prompt: string;
    model?: string;
    context?: {
      propertyId?: string;
      leadId?: string;
      purpose?: 'listing' | 'followup' | 'offer' | 'general';
    }
  };

  if (!channelId || !prompt) {
    return NextResponse.json({ error: 'channelId and prompt are required.' }, { status: 400 });
  }

  try {
    const text = await aiService.compose({ channelId, prompt, model, context });
    return NextResponse.json({ text });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
