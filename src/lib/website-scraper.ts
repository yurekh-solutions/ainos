// Universal Website Scraper - works with ANY tech stack
// React, Next.js, HTML, PHP, WordPress, Shopify, Wix, etc.
import { generateAIText } from '@/lib/ai-provider';

interface ScrapedData {
  url: string;
  name: string;
  description: string;
  techStack: string;
  headings: string[];
  metaKeywords: string[];
  pageLinks: string[];
  openGraph: Record<string, string>;
  jsonLd: Record<string, unknown>[];
  rawText: string;
  // Audit-grade signals
  titleRaw: string;
  h1Count: number;
  imgTotal: number;
  imgMissingAlt: number;
  hasViewport: boolean;
  hasCanonical: boolean;
  hasFavicon: boolean;
  hasTwitterCard: boolean;
  wordCount: number;
}

// Detect tech stack from HTML signatures
function detectTechStack(html: string, url: string): string {
  const lower = html.toLowerCase();

  if (lower.includes('__next_data__') || lower.includes('_next/static')) return 'nextjs';
  if (lower.includes('wp-content') || lower.includes('wp-includes') || lower.includes('wordpress')) return 'wordpress';
  if (lower.includes('shopify-cdn') || lower.includes('myshopify.com') || lower.includes('shopify')) return 'shopify';
  if (lower.includes('wix.com') || lower.includes('wixstatic')) return 'wix';
  if (lower.includes('squarespace') || lower.includes('sqspcdn')) return 'squarespace';
  if (lower.includes('webflow') || lower.includes('webflow.io')) return 'webflow';
  if (lower.includes('reactroot') || lower.includes('root"') && lower.includes('static/js')) return 'react';
  if (lower.includes('vue') && lower.includes('vue.app')) return 'vue';
  if (lower.includes('angular') && lower.includes('ng-')) return 'angular';
  if (lower.includes('gatsby')) return 'gatsby';
  if (lower.includes('astro')) return 'astro';
  if (lower.includes('<php') || url.endsWith('.php')) return 'php';
  if (lower.includes('<!doctype html>') || lower.includes('<html')) return 'html';

  return 'other';
}

// Extract text content from HTML (strip tags)
function extractText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 5000);
}

// Parse HTML to extract structured data
function parseHTML(html: string, baseUrl: string): ScrapedData {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const name = titleMatch ? titleMatch[1].trim() : new URL(baseUrl).hostname;

  // Extract meta description
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const description = descMatch ? descMatch[1].trim() : '';

  // Extract meta keywords
  const kwMatch = html.match(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']keywords["']/i);
  const metaKeywords = kwMatch ? kwMatch[1].split(',').map(k => k.trim()).filter(Boolean) : [];

  // Extract headings
  const headings: string[] = [];
  const hRegex = /<h[1-3][^>]*>([^<]*(?:<[^>]+>[^<]*)*)<\/h[1-3]>/gi;
  let hMatch;
  while ((hMatch = hRegex.exec(html)) !== null) {
    const text = hMatch[1].replace(/<[^>]+>/g, '').trim();
    if (text.length > 2 && text.length < 200) headings.push(text);
  }

  // Extract OpenGraph tags
  const openGraph: Record<string, string> = {};
  const ogRegex = /<meta[^>]+property=["'](og:[^"']+)["'][^>]+content=["']([^"']*)["']/gi;
  let ogMatch;
  while ((ogMatch = ogRegex.exec(html)) !== null) {
    openGraph[ogMatch[1]] = ogMatch[2];
  }

  // Extract JSON-LD
  const jsonLd: Record<string, unknown>[] = [];
  const ldRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let ldMatch;
  while ((ldMatch = ldRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(ldMatch[1]);
      jsonLd.push(parsed);
    } catch { /* skip invalid JSON-LD */ }
  }

  // Extract internal page links
  const pageLinks: string[] = [];
  const linkRegex = /<a[^>]+href=["'](\/[^"']*)["'][^>]*>([^<]*)<\/a>/gi;
  let linkMatch;
  const seen = new Set<string>();
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const href = linkMatch[1];
    const text = linkMatch[2].replace(/<[^>]+>/g, '').trim();
    if (!seen.has(href) && text.length > 1 && text.length < 100 && !href.includes('.') && !href.startsWith('/api')) {
      seen.add(href);
      pageLinks.push(`${text}: ${href}`);
    }
  }

  // Detect tech stack
  const techStack = detectTechStack(html, baseUrl);

  // Extract raw text for AI analysis
  const rawText = extractText(html);

  // Audit-grade signals
  const titleRaw = titleMatch ? titleMatch[1].trim() : '';
  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  const imgTags = html.match(/<img\b[^>]*>/gi) || [];
  const imgTotal = imgTags.length;
  const imgMissingAlt = imgTags.filter((t) => !/\balt\s*=\s*["'][^"']+["']/i.test(t)).length;
  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);
  const hasFavicon = /<link[^>]+rel=["'](icon|shortcut icon|apple-touch-icon)["']/i.test(html);
  const hasTwitterCard = /<meta[^>]+name=["']twitter:card["']/i.test(html);
  const wordCount = rawText.split(/\s+/).filter(Boolean).length;

  return {
    url: baseUrl, name, description, techStack, headings, metaKeywords, pageLinks,
    openGraph, jsonLd, rawText,
    titleRaw, h1Count, imgTotal, imgMissingAlt, hasViewport, hasCanonical,
    hasFavicon, hasTwitterCard, wordCount,
  };
}

// Fetch and scrape a single page
async function scrapePage(url: string): Promise<ScrapedData | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AINOS-Blog-Agent/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;

    const html = await res.text();
    return parseHTML(html, url);
  } catch {
    return null;
  }
}

// Crawl inner pages for deeper context
async function crawlInnerPages(baseUrl: string, links: string[]): Promise<string[]> {
  const pagesToCrawl = ['/about', '/services', '/blog', '/products', '/pricing', '/features', '/company', '/team'];
  const results: string[] = [];

  // Try common paths first
  for (const path of pagesToCrawl) {
    if (results.length >= 3) break;
    const url = `${baseUrl.replace(/\/$/, '')}${path}`;
    const data = await scrapePage(url);
    if (data && data.rawText.length > 200) {
      results.push(data.rawText.substring(0, 2000));
    }
  }

  // Also try links from the page
  if (results.length < 3) {
    for (const link of links.slice(0, 10)) {
      if (results.length >= 3) break;
      const href = link.split(': ').pop();
      if (!href) continue;
      const fullUrl = href.startsWith('http') ? href : `${baseUrl.replace(/\/$/, '')}${href}`;
      const data = await scrapePage(fullUrl);
      if (data && data.rawText.length > 200) {
        results.push(data.rawText.substring(0, 2000));
      }
    }
  }

  return results;
}

// AI analysis of website content
async function analyzeWebsite(
  scrapedData: ScrapedData,
  innerPages: string[]
): Promise<{
  niche: string;
  brandVoice: string;
  competitors: string[];
  topics: string[];
}> {
  const contentSummary = `
Website: ${scrapedData.name}
URL: ${scrapedData.url}
Description: ${scrapedData.description}
Tech Stack: ${scrapedData.techStack}
Headings: ${scrapedData.headings.slice(0, 10).join(', ')}
Keywords: ${scrapedData.metaKeywords.join(', ')}
Page Content: ${scrapedData.rawText.substring(0, 3000)}
Inner Pages: ${innerPages.join('\n---\n').substring(0, 3000)}
  `.trim();

  const systemPrompt = `You are an expert website analyst and SEO strategist. Analyze the given website content and return ONLY valid JSON (no markdown, no other text).

Return this exact JSON format:
{
  "niche": "The primary industry/niche of this website (1-3 words)",
  "brandVoice": "Description of the brand's tone and voice (formal/casual/technical/etc, 1-2 sentences)",
  "competitors": ["Competitor 1", "Competitor 2", "Competitor 3"],
  "topics": [
    "Blog topic 1 (specific, SEO-friendly, actionable)",
    "Blog topic 2",
    ...30 topics total...
  ]
}

Rules:
- Generate exactly 30 unique, SEO-optimized blog topics tailored to this website's niche
- Topics should be specific enough to write 3000-word articles about
- Mix of informational, commercial, and transactional intent topics
- Include trending topics and evergreen content
- Topics should help the website rank on Google and get cited by AI`;

  try {
    const text = await generateAIText(systemPrompt, contentSummary, { json: true });
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse AI response');
      }
    }

    return {
      niche: result.niche || scrapedData.metaKeywords[0] || 'General Business',
      brandVoice: result.brandVoice || 'Professional and informative',
      competitors: result.competitors || [],
      topics: result.topics || [],
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    // Dynamic fallback: detect niche from all available data and generate unique topics
    const name = scrapedData.name || '';
    const desc = scrapedData.description || '';
    const headings = scrapedData.headings.join(' ');
    const keywords = scrapedData.metaKeywords.join(' ');
    const content = scrapedData.rawText;

    // Smart niche detection from multiple signals
    const allText = `${name} ${desc} ${headings} ${keywords} ${content}`.toLowerCase();
    const nicheSignals: Record<string, string[]> = {
      'Fashion & Clothing': ['fashion', 'clothing', 'apparel', 'wear', 'style', 'outfit', 'dress', 'pants', 'jeans', 'shirt', 'garment', 'textile', 'boutique', 'wardrobe'],
      'Technology & Software': ['tech', 'software', 'app', 'digital', 'cloud', 'saas', 'platform', 'ai', 'machine learning', 'coding', 'developer', 'programming'],
      'Health & Wellness': ['health', 'wellness', 'medical', 'fitness', 'nutrition', 'diet', 'yoga', 'mental health', 'healthcare', 'hospital', 'clinic'],
      'Food & Restaurant': ['food', 'restaurant', 'recipe', 'cooking', 'cuisine', 'meal', 'chef', 'dining', 'cafe', 'bakery', 'catering'],
      'Real Estate': ['real estate', 'property', 'housing', 'apartment', 'rental', 'mortgage', 'home', 'land', 'construction', 'interior'],
      'Education & Learning': ['education', 'learning', 'course', 'training', 'school', 'university', 'student', 'teacher', 'academic', 'certification'],
      'Finance & Banking': ['finance', 'banking', 'investment', 'loan', 'insurance', 'trading', 'stock', 'crypto', 'accounting', 'tax'],
      'E-commerce & Retail': ['ecommerce', 'retail', 'shopping', 'store', 'product', 'marketplace', 'online shopping', 'cart', 'checkout'],
      'Travel & Tourism': ['travel', 'tourism', 'hotel', 'flight', 'vacation', 'destination', 'tour', 'trip', 'booking', 'hospitality'],
      'Marketing & Advertising': ['marketing', 'advertising', 'seo', 'social media', 'branding', 'content', 'digital marketing', 'campaign'],
      'Automotive': ['car', 'automotive', 'vehicle', 'auto', 'motorcycle', 'electric vehicle', 'ev', 'driving', 'garage'],
      'Beauty & Cosmetics': ['beauty', 'cosmetics', 'skincare', 'makeup', 'salon', 'spa', 'hair', 'fragrance', 'grooming'],
      'Sports & Fitness': ['sports', 'fitness', 'gym', 'exercise', 'athlete', 'training', 'workout', 'running', 'cycling'],
      'Legal Services': ['legal', 'law', 'attorney', 'lawyer', 'court', 'litigation', 'compliance', 'contract'],
      'Manufacturing & Industrial': ['manufacturing', 'industrial', 'factory', 'production', 'supply chain', 'logistics', 'engineering'],
    };

    let detectedNiche = 'Business';
    let maxScore = 0;
    for (const [niche, signals] of Object.entries(nicheSignals)) {
      const score = signals.filter(s => allText.includes(s)).length;
      if (score > maxScore) {
        maxScore = score;
        detectedNiche = niche;
      }
    }

    // If no strong signal, use meta keywords or name
    if (maxScore === 0) {
      detectedNiche = scrapedData.metaKeywords[0] || name.split('|')[0].trim() || desc.split(' ').slice(0, 3).join(' ') || 'Business';
    }

    const n = detectedNiche;
    // 30 unique, varied topic templates - all dynamic based on detected niche
    const topicTemplates = [
      `The Complete Guide to ${n}: Everything Beginners Need to Know`,
      `Top 10 ${n} Trends Shaping the Industry in 2026`,
      `How to Choose the Right ${n} Solutions: A Buyer's Guide`,
      `${n} Mistakes Everyone Makes (And How to Avoid Them)`,
      `The Ultimate ${n} Checklist for Professionals`,
      `How ${n} is Evolving: What to Expect in the Next 5 Years`,
      `Beginner to Pro: Your Complete ${n} Learning Roadmap`,
      `15 Expert Tips to Master ${n} Faster`,
      `${n} vs the Competition: What Makes the Difference`,
      `The Hidden Costs of ${n} Nobody Talks About`,
      `How to Build a Winning ${n} Strategy from Scratch`,
      `${n} for Small Businesses: A Practical Getting-Started Guide`,
      `The Science Behind ${n}: What Research Actually Says`,
      `Case Study: How One Company Transformed Their ${n} Approach`,
      `${n} Tools and Software Worth Using in 2026`,
      `The ROI of Investing in ${n}: Is It Worth It?`,
      `Common ${n} Myths Debunked with Real Data`,
      `How to Stay Ahead of the Curve in ${n}`,
      `${n} Best Practices: Lessons from Industry Leaders`,
      `A Day in the Life: What Working in ${n} Actually Looks Like`,
      `The Future of ${n}: AI, Automation, and What's Next`,
      `How to Measure Success in ${n}: KPIs That Actually Matter`,
      `${n} on a Budget: Smart Strategies That Don't Break the Bank`,
      `The Complete ${n} Glossary: Terms Every Professional Should Know`,
      `How ${n} Impacts Customer Experience and Loyalty`,
      `${n} Compliance and Regulations: What You Need to Know`,
      `From Zero to Hero: Building Your First ${n} Campaign`,
      `The Psychology Behind Effective ${n} Decisions`,
      `${n} Trends by Region: A Global Perspective`,
      `Your ${n} Action Plan: 30 Days to Meaningful Results`,
    ];

    return {
      niche: detectedNiche,
      brandVoice: 'Professional and informative',
      competitors: [],
      topics: topicTemplates,
    };
  }
}

// Main export: Connect and analyze a website
export async function connectAndAnalyzeWebsite(url: string): Promise<{
  scrapedData: ScrapedData;
  analysis: {
    niche: string;
    brandVoice: string;
    competitors: string[];
    topics: string[];
  };
}> {
  // Normalize URL
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

  // Scrape homepage
  const scrapedData = await scrapePage(normalizedUrl);
  if (!scrapedData) {
    throw new Error('Could not access website. Please check the URL and ensure the site is publicly accessible.');
  }

  // Crawl inner pages
  const innerPages = await crawlInnerPages(normalizedUrl, scrapedData.pageLinks);

  // AI analysis
  const analysis = await analyzeWebsite(scrapedData, innerPages);

  return { scrapedData, analysis };
}

export { scrapePage, detectTechStack, parseHTML };
export type { ScrapedData };
