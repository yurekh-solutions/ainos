import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { generateMedia, STYLE_MODEL_MAP } from '@/lib/muapi';
import { prisma } from '@/lib/prisma';
import { assertToolCredits, chargeToolRun } from '@/lib/tool-charge';

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
    const account = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { companyId: true },
    });
    const companyId = account?.companyId ?? null;
    const mediaKind = mediaType === 'video' ? 'video' : 'image';
    const costKey = `ai-media-${mediaKind}`;
    const affordable = await assertToolCredits(companyId, costKey);
    if (!affordable.ok) {
      return NextResponse.json(
        { error: affordable.error, creditsRequired: affordable.cost, balance: affordable.balance },
        { status: 402 }
      );
    }

    const result = await generateMedia(prompt.trim(), mediaType || 'image', style || 'photorealistic');

    const charge = await chargeToolRun(companyId, costKey, `AI media (${mediaKind})`);
    return NextResponse.json({
      success: true,
      url: result.url,
      status: result.status,
      model: result.model,
      prompt: result.prompt,
      creditsUsed: charge.cost,
      creditsBalance: charge.balance,
    });
  } catch (error) {
    console.error('AI Media generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
