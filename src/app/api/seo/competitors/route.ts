import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { scrapePage, type ScrapedData } from '@/lib/website-scraper';
import { generateAIText } from '@/lib/ai-provider';

// Competitor analysis: scrapes BOTH websites for real on-page signals,
// then Gemini compares them with specific, actionable recommendations.

function siteDigest(data: ScrapedData | null, url: string): string {
  if (!data) return `Website: ${url}\n(Could not fetch this site — analyze based on the URL and niche only.)`;
  return [
    `Website: ${url}`,
    `Title: ${data.titleRaw || '(missing)'}`,
    `Meta description: ${data.description || '(missing)'}`,
    `Tech stack: ${data.techStack}`,
    `Headings: ${data.headings.slice(0, 8).join(' | ') || '(none)'}`,
    `Word count: ${data.wordCount}`,
    `H1 count: ${data.h1Count}`,
    `Images: ${data.imgTotal} (${data.imgMissingAlt} missing alt)`,
    `Has Open Graph: ${Boolean(data.openGraph['og:title'])}, Schema blocks: ${data.jsonLd.length}`,
    `Has blog-ish links: ${data.pageLinks.filter((l) => /blog|articles|news|resources|insights/i.test(l)).slice(0, 3).join(', ') || 'none detected'}`,
    `Page snippet: ${data.rawText.substring(0, 900)}`,
  ].join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { competitorUrl, yourUrl } = await req.json();
    if (!competitorUrl || !yourUrl) return NextResponse.json({ error: 'Both URLs are required' }, { status: 400 });

    const norm = (u: string) => (String(u).startsWith('http') ? String(u) : `https://${String(u)}`);
    const yours = norm(yourUrl);
    const theirs = norm(competitorUrl);

    // Scrape both sites in parallel — real data, best effort
    const [yourData, theirData] = await Promise.all([
      scrapePage(yours).catch(() => null),
      scrapePage(theirs).catch(() => null),
    ]);

    const systemPrompt = `You are an expert SEO competitor analyst. You receive REAL scraped data from both websites. Compare them honestly and give the user a concrete action plan.

You must respond in this exact JSON format (no other text):
{
  "analysis": "3-5 paragraph comparison covering content, on-page SEO, positioning and what each does better",
  "strengths": ["Competitor strength (specific, from the data)", "..."],
  "weaknesses": ["Competitor weakness you can exploit", "..."],
  "opportunities": ["Specific opportunity for the user's site", "..."],
  "keywordsTheyRankFor": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"],
  "contentGaps": ["Topic the competitor covers that the user should build", "..."],
  "actionPlan": ["Step 1 to do this week", "Step 2", "Step 3"]
}`;

    const userPrompt = `Compare these two websites for SEO:\n\n=== USER'S WEBSITE ===\n${siteDigest(yourData, yours)}\n\n=== COMPETITOR WEBSITE ===\n${siteDigest(theirData, theirs)}\n\nBe specific and actionable. If a site could not be fetched, say so in the analysis and base conclusions on the available data.`;

    const text = await generateAIText(systemPrompt, userPrompt, { json: true });
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const match = text.replace(/```(?:json)?/gi, '').match(/\{[\s\S]*\}/);
      if (match) data = JSON.parse(match[0]);
      else throw new Error('Could not parse competitor data');
    }

    return NextResponse.json({
      ...data,
      scrapedYours: Boolean(yourData),
      scrapedTheirs: Boolean(theirData),
    });
  } catch (error) {
    console.error('Competitor analysis error:', error);
    const message = error instanceof Error ? error.message : 'Competitor analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
