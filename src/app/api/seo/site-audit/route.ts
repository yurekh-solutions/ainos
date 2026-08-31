import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { scrapePage } from '@/lib/website-scraper';
import { generateAIText } from '@/lib/ai-provider';

// Real on-page SEO audit: fetches the live site and inspects actual HTML signals,
// then Gemini ranks the top 3 fixes a founder should do first.

interface Check {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  fix: string;
  weight: number;
}

async function probe(origin: string, path: string): Promise<boolean> {
  try {
    const res = await fetch(`${origin}${path}`, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AINOS-SEO-Audit/1.0)' },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    let origin = '';
    try {
      origin = new URL(normalizedUrl).origin;
    } catch {
      return NextResponse.json({ error: 'Please enter a valid website URL' }, { status: 400 });
    }

    const data = await scrapePage(normalizedUrl);
    if (!data) {
      return NextResponse.json({
        error: 'Could not access this website. Check the URL and make sure the site is publicly live.',
      }, { status: 502 });
    }

    const [hasSitemap, hasRobots] = await Promise.all([
      probe(origin, '/sitemap.xml'),
      probe(origin, '/robots.txt'),
    ]);

    const checks: Check[] = [];
    const add = (name: string, status: Check['status'], message: string, fix: string, weight = 1) =>
      checks.push({ name, status, message, fix, weight });

    // 1. HTTPS
    add(
      'HTTPS Security',
      normalizedUrl.startsWith('https') ? 'ok' : 'error',
      normalizedUrl.startsWith('https') ? 'Your site is served over HTTPS.' : 'Your site is not using HTTPS — Google ranks secure sites higher.',
      'Install an SSL certificate (free via Let’s Encrypt) and redirect all HTTP traffic to HTTPS.',
      2
    );

    // 2. Title tag
    const titleLen = data.titleRaw.length;
    if (!data.titleRaw) add('Title Tag', 'error', 'No <title> tag found on the homepage.', 'Add a unique title of 50-60 characters that includes your main keyword and brand.', 3);
    else if (titleLen >= 30 && titleLen <= 65) add('Title Tag', 'ok', `Title found (${titleLen} chars): “${data.titleRaw}”`, 'Keep titles unique per page, 50-60 characters.', 3);
    else add('Title Tag', 'warning', `Title is ${titleLen} chars — ${titleLen < 30 ? 'too short to rank well' : 'may get truncated in Google'}.`, 'Rewrite the title to 50-60 characters with your primary keyword near the start.', 3);

    // 3. Meta description
    const descLen = data.description.length;
    if (!data.description) add('Meta Description', 'error', 'No meta description found — Google will show random text instead.', 'Write a compelling 140-160 character description with a call to action.', 3);
    else if (descLen >= 70 && descLen <= 170) add('Meta Description', 'ok', `Meta description found (${descLen} chars).`, 'Keep one unique description per page, 140-160 characters.', 2);
    else add('Meta Description', 'warning', `Meta description is ${descLen} chars — outside the ideal 140-160 range.`, 'Adjust the description length to 140-160 characters and add a benefit + CTA.', 2);

    // 4. H1
    if (data.h1Count === 1) add('H1 Heading', 'ok', 'Exactly one H1 heading found — perfect.', 'Keep one H1 per page that states the page topic.', 2);
    else if (data.h1Count === 0) add('H1 Heading', 'error', 'No H1 heading found — search engines can’t tell what the page is about.', 'Add a single H1 with your primary keyword (e.g. “Best Bakery in Mumbai”).', 2);
    else add('H1 Heading', 'warning', `${data.h1Count} H1 headings found — use only one per page.`, 'Keep the main H1, convert the others to H2/H3 subheadings.', 2);

    // 5. Image alt text
    if (data.imgTotal === 0) add('Image Alt Text', 'ok', 'No images detected on the homepage.', 'When adding images, always describe them with alt text.', 1);
    else if (data.imgMissingAlt === 0) add('Image Alt Text', 'ok', `All ${data.imgTotal} images have alt text.`, 'Keep alt text descriptive and keyword-natural.', 1);
    else add('Image Alt Text', data.imgMissingAlt / data.imgTotal > 0.5 ? 'error' : 'warning',
      `${data.imgMissingAlt} of ${data.imgTotal} images are missing alt text.`,
      'Add descriptive alt text to every image — it powers Google Images traffic and accessibility.', 1);

    // 6. Mobile viewport
    add('Mobile Friendly', data.hasViewport ? 'ok' : 'error',
      data.hasViewport ? 'Viewport meta tag present — site is mobile-ready.' : 'No viewport meta tag — the site will fail Google’s mobile-first indexing.',
      'Add <meta name="viewport" content="width=device-width, initial-scale=1"> and use responsive CSS.', 3);

    // 7. Canonical
    add('Canonical URL', data.hasCanonical ? 'ok' : 'warning',
      data.hasCanonical ? 'Canonical tag present — duplicate content is controlled.' : 'No canonical tag — duplicate URLs may split your rankings.',
      'Add a self-referencing <link rel="canonical"> on every page.', 1);

    // 8. Open Graph
    const ogOk = Boolean(data.openGraph['og:title'] && data.openGraph['og:description'] && data.openGraph['og:image']);
    add('Social Sharing (Open Graph)', ogOk ? 'ok' : 'warning',
      ogOk ? 'Open Graph tags present — links will preview nicely on WhatsApp/LinkedIn/Facebook.' : 'Missing og:title/og:description/og:image — shared links look broken on social apps.',
      'Add og:title, og:description and og:image (1200x630) meta tags so shares look professional.', 1);

    // 9. Twitter card
    add('Twitter/X Card', data.hasTwitterCard ? 'ok' : 'warning',
      data.hasTwitterCard ? 'Twitter card tag present.' : 'No twitter:card tag — X previews will be plain.',
      'Add <meta name="twitter:card" content="summary_large_image">.', 1);

    // 10. Structured data
    add('Schema Markup (JSON-LD)', data.jsonLd.length > 0 ? 'ok' : 'warning',
      data.jsonLd.length > 0 ? `${data.jsonLd.length} JSON-LD schema block(s) found — eligible for rich results.` : 'No structured data — you are missing rich snippets (stars, FAQs, breadcrumbs).',
      'Add JSON-LD schema: Organization + LocalBusiness + FAQPage on key pages.', 2);

    // 11. Content depth
    if (data.wordCount >= 300) add('Content Depth', 'ok', `~${data.wordCount} words of visible text on the homepage.`, 'Keep publishing useful content regularly — depth builds authority.', 2);
    else if (data.wordCount >= 100) add('Content Depth', 'warning', `Only ~${data.wordCount} words on the homepage — thin content ranks poorly.`, 'Expand the homepage with clear sections: services, benefits, proof, FAQs (aim 500+ words).', 2);
    else add('Content Depth', 'error', `Only ~${data.wordCount} words detected — Google sees this as a thin page.`, 'Add real content: what you do, who it’s for, proof, and FAQs. Target 500+ words per key page.', 3);

    // 12. Internal linking
    if (data.pageLinks.length >= 5) add('Internal Linking', 'ok', `${data.pageLinks.length} internal links found — good site structure.`, 'Keep linking related pages together with descriptive anchor text.', 1);
    else if (data.pageLinks.length >= 1) add('Internal Linking', 'warning', `Only ${data.pageLinks.length} internal link(s) — weak site structure.`, 'Add a clear menu + footer links to all key pages (services, about, contact, blog).', 1);
    else add('Internal Linking', 'error', 'No internal links detected — crawlers can’t discover your pages.', 'Add navigation linking every important page from the homepage.', 2);

    // 13. Sitemap
    add('XML Sitemap', hasSitemap ? 'ok' : 'warning',
      hasSitemap ? 'sitemap.xml is live.' : 'No sitemap.xml found at /sitemap.xml.',
      'Generate sitemap.xml and submit it in Google Search Console.', 1);

    // 14. Robots.txt
    add('Robots.txt', hasRobots ? 'ok' : 'warning',
      hasRobots ? 'robots.txt is live.' : 'No robots.txt found.',
      'Add a robots.txt that allows all good bots and points to your sitemap.', 1);

    // 15. Favicon
    add('Favicon', data.hasFavicon ? 'ok' : 'warning',
      data.hasFavicon ? 'Favicon detected — your brand shows in browser tabs.' : 'No favicon link detected.',
      'Add a favicon (SVG/PNG) link tag — small trust signal in tabs and SERPs.', 1);

    const maxScore = checks.reduce((s, c) => s + c.weight, 0);
    const earned = checks.reduce((s, c) => s + (c.status === 'ok' ? c.weight : c.status === 'warning' ? c.weight * 0.5 : 0), 0);
    const score = Math.round((earned / maxScore) * 100);

    // AI: founder-friendly priority fixes from the REAL failing checks
    let aiSummary: { summary: string; priorities: Array<{ title: string; why: string; how: string }> } | null = null;
    const problems = checks.filter((c) => c.status !== 'ok');
    try {
      const aiRaw = await generateAIText(
        'You are a pragmatic SEO consultant advising a busy startup founder. Based on the REAL audit findings given, return ONLY valid JSON: {"summary":"2-3 sentence plain-language verdict of the site’s SEO health","priorities":[{"title":"short fix name","why":"business impact in one line","how":"exact step to fix, non-technical"}]}. Give exactly 3 priorities, ordered by impact. No jargon.',
        `Website: ${normalizedUrl}\nTech stack: ${data.techStack}\nAudit score: ${score}/100\nFailing/warning checks:\n${problems.map((p) => `- ${p.name}: ${p.message}`).join('\n') || 'None — site looks healthy; suggest growth next-steps like content + local SEO.'}`,
        { json: true }
      );
      const parsed = JSON.parse(aiRaw.replace(/```(?:json)?/gi, ''));
      if (parsed && typeof parsed.summary === 'string' && Array.isArray(parsed.priorities)) {
        aiSummary = {
          summary: parsed.summary,
          priorities: parsed.priorities.slice(0, 3).map((p: Record<string, unknown>) => ({
            title: String(p.title ?? ''),
            why: String(p.why ?? ''),
            how: String(p.how ?? ''),
          })),
        };
      }
    } catch {
      aiSummary = null; // audit still fully useful without AI
    }

    return NextResponse.json({
      url: normalizedUrl,
      score,
      checks,
      techStack: data.techStack,
      pageTitle: data.titleRaw,
      wordCount: data.wordCount,
      aiSummary,
    });
  } catch (error) {
    console.error('Site audit error:', error);
    return NextResponse.json({ error: 'Audit failed — please try again' }, { status: 500 });
  }
}
