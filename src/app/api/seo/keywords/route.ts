import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { generateAIText } from '@/lib/ai-provider';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { keyword, niche } = await req.json();
    if (!keyword) return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });

    const systemPrompt = `You are an expert SEO keyword researcher. Generate high-value keyword suggestions based on a seed keyword and niche.

For each keyword provide:
- keyword: the exact keyword phrase
- difficulty: Low / Medium / High
- volume: estimated monthly search volume (e.g. "5K", "12K", "50K")
- intent: Informational / Navigational / Transactional / Commercial
- cpc: estimated CPC in USD (e.g. "$1.2", "$5.5")
- trend: trending, stable, or seasonal

You must respond in this exact JSON format (no other text):
{
  "keywords": [
    { "keyword": "example keyword", "difficulty": "Low", "volume": "10K", "intent": "Informational", "cpc": "$2.5", "trend": "trending" }
  ]
}`;

    const userPrompt = `Generate 20 keyword ideas for:
Seed keyword: "${keyword}"
${niche ? `Niche/Industry: ${niche}` : ''}

Include a mix of:
- Short-tail keywords
- Long-tail keywords
- Question-based keywords
- Local/global variations
- High commercial intent keywords

Make them realistic and valuable for SEO content strategy.`;

    const text = await generateAIText(systemPrompt, userPrompt, { json: true });
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const match = text.replace(/```(?:json)?/gi, '').match(/\{[\s\S]*\}/);
      if (match) data = JSON.parse(match[0]);
      else throw new Error('Could not parse keyword data');
    }

    const keywords = Array.isArray(data.keywords) ? data.keywords.slice(0, 20) : [];
    return NextResponse.json({ keywords });
  } catch (error) {
    console.error('Keyword research error:', error);
    const message = error instanceof Error ? error.message : 'Keyword research failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
