import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { competitorUrl, yourUrl } = await req.json();
    if (!competitorUrl || !yourUrl) return NextResponse.json({ error: 'Both URLs are required' }, { status: 400 });

    const systemPrompt = `You are an expert SEO competitor analyst. Analyze a competitor's website vs the user's website and provide actionable insights.

You must respond in this exact JSON format (no other text):
{
  "analysis": "Detailed competitor analysis in markdown-like paragraphs with clear sections",
  "strengths": ["Competitor strength 1", "Strength 2"],
  "weaknesses": ["Competitor weakness 1", "Weakness 2"],
  "opportunities": ["Opportunity 1", "Opportunity 2"],
  "keywordsTheyRankFor": ["keyword 1", "keyword 2", "keyword 3"],
  "contentGaps": ["Missing topic 1", "Missing topic 2"]
}`;

    const userPrompt = `Compare these two websites and provide a detailed SEO competitor analysis:

User's Website: ${yourUrl}
Competitor Website: ${competitorUrl}

Analyze:
1. What the competitor is likely doing well
2. Their weaknesses
3. Opportunities for the user's website
4. Keywords they likely rank for
5. Content gaps to exploit

Be specific and actionable.`;

    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!res.ok) throw new Error('AI competitor analysis failed');

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) data = JSON.parse(match[0]);
      else throw new Error('Could not parse competitor data');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Competitor analysis error:', error);
    const message = error instanceof Error ? error.message : 'Competitor analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
