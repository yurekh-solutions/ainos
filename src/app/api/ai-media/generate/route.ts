import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { generateMedia, STYLE_MODEL_MAP } from '@/lib/muapi';

// POST /api/ai-media/generate - Generate AI media (FREE via Pollinations.ai)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { prompt, mediaType, style } = body;

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Generate using Pollinations.ai (free, no API key)
    const result = await generateMedia(prompt.trim(), mediaType || 'image', style || 'photorealistic');

    return NextResponse.json({
      success: true,
      url: result.url,
      status: result.status,
      model: result.model,
      prompt: result.prompt,
    });
  } catch (error) {
    console.error('AI Media generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
