import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { generateAIText } from '@/lib/ai-provider';

// Content Gap Analyzer - finds topics competitors are missing
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { niche, competitorUrls } = await req.json();
    if (!niche) return NextResponse.json({ error: 'Niche required' }, { status: 400 });

    // Scrape competitor headings (lightweight)
    const competitorTopics: string[] = [];
    
    if (competitorUrls && Array.isArray(competitorUrls)) {
      for (const url of competitorUrls.slice(0, 5)) {
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
          if (res.ok) {
            const html = await res.text();
            const headings = html.match(/<h[123][^>]*>(.*?)<\/h[123]>/gi) || [];
            const cleanHeadings = headings.map(h => h.replace(/<[^>]+>/g, '').trim());
            competitorTopics.push(...cleanHeadings.slice(0, 10));
          }
        } catch {
          // Skip failed scrapes
        }
      }
    }

    const systemPrompt = 'You are an SEO content strategist specializing in content gap analysis.';
    const userPrompt = `Analyze content gaps in the ${niche} niche.

${competitorTopics.length > 0 ? `Competitor blog topics found:\n${competitorTopics.slice(0, 20).join('\n')}\n\n` : ''}

Find 10 topics that:
1. Have high search demand but low competition
2. Competitors are NOT covering (or covering poorly)
3. Are relevant to ${niche}
4. Can drive organic traffic

Return as JSON array:
[{ "topic": "...", "searchVolume": "high|medium|low", "difficulty": 1-10, "reason": "why this is a gap" }]`;

    const result = await generateAIText(systemPrompt, userPrompt, { json: true });

    const gaps = Array.isArray(result) ? result : [];

    return NextResponse.json({ 
      niche,
      competitorCount: competitorUrls?.length || 0,
      gaps 
    });
  } catch (error) {
    console.error('Content gap error:', error);
    return NextResponse.json({ error: 'Failed to analyze content gaps' }, { status: 500 });
  }
}
