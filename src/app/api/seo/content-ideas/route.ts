import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { niche, keyword } = await req.json();
    if (!niche) return NextResponse.json({ error: 'Niche is required' }, { status: 400 });

    const systemPrompt = `You are an expert content strategist. Generate high-quality SEO/AEO content ideas for a niche.

For each idea provide:
- title: compelling blog/video title
- type: Blog Post / Video / Infographic / How-To / Listicle / Case Study
- keywords: 3-5 target keywords
- outline: 4-6 bullet points covering the content structure
- searchIntent: Informational / Transactional / Commercial
- estimatedReadTime: e.g. "5 min", "12 min"

You must respond in this exact JSON format (no other text):
{
  "ideas": [
    { "title": "Example Title", "type": "Blog Post", "keywords": ["kw1", "kw2"], "outline": ["Intro", "Point 1", "Point 2", "Conclusion"], "searchIntent": "Informational", "estimatedReadTime": "7 min" }
  ]
}`;

    const userPrompt = `Generate 10 content ideas for this niche:
Niche: ${niche}
${keyword ? `Target keyword to focus on: ${keyword}` : ''}

Make ideas:
- SEO-optimized with clear search intent
- AEO-friendly (answer engine optimized)
- Trending and valuable for 2026
- Suitable for blog posts and social media repurposing
- Include actionable takeaways for readers`;

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

    if (!res.ok) throw new Error('AI content ideas failed');

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) data = JSON.parse(match[0]);
      else throw new Error('Could not parse content ideas');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Content ideas error:', error);
    const message = error instanceof Error ? error.message : 'Content ideas failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
