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

CRITICAL: The topics MUST be specific to this website's actual business. If the website is about AV equipment rental, topics should be about projectors, LED screens, sound systems, event equipment — NOT generic "Technology & Software". If it's a fashion brand, topics should be about clothing, styling, trends — NOT generic business advice.

Return this exact JSON format:
{
  "niche": "The primary industry/niche of this website (specific, 2-5 words, e.g., 'AV Equipment Rental', 'Women's Fashion Boutique', 'Corporate Law Firm')",
  "brandVoice": "Description of the brand's tone and voice (formal/casual/technical/etc, 1-2 sentences)",
  "competitors": ["Competitor 1", "Competitor 2", "Competitor 3"],
  "topics": [
    "Blog topic 1 (specific to this website's business, SEO-friendly, actionable)",
    "Blog topic 2",
    ...30 topics total...
  ]
}

Rules:
- Generate exactly 30 unique, SEO-optimized blog topics SPECIFICALLY TAILORED to this website's actual business
- Topics should mention specific products/services/locations relevant to this business
- Mix of informational, commercial, and transactional intent topics
- Include trending topics and evergreen content
- Topics should help the website rank on Google for its specific niche
- DO NOT generate generic topics that could apply to any business`;

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
      'AV Equipment Rental': ['av equipment', 'audio visual', 'projector rental', 'led screen', 'sound system', 'speaker rental', 'microphone', 'stage lighting', 'event equipment', 'av rental', 'multimedia rental', 'projection', 'pa system', 'dj equipment'],
      'Event Services': ['event planning', 'wedding planner', 'corporate event', 'conference', 'party planner', 'event organizer', 'venue', 'event decoration', 'catering service', 'event management'],
      'Fashion & Clothing': ['fashion', 'clothing', 'apparel', 'wear', 'style', 'outfit', 'dress', 'pants', 'jeans', 'shirt', 'garment', 'textile', 'boutique', 'wardrobe', 'designer wear'],
      'Technology & Software': ['tech', 'software', 'app', 'digital', 'cloud', 'saas', 'platform', 'ai', 'machine learning', 'coding', 'developer', 'programming'],
      'Health & Wellness': ['health', 'wellness', 'medical', 'fitness', 'nutrition', 'diet', 'yoga', 'mental health', 'healthcare', 'hospital', 'clinic', 'doctor'],
      'Food & Restaurant': ['food', 'restaurant', 'recipe', 'cooking', 'cuisine', 'meal', 'chef', 'dining', 'cafe', 'bakery', 'catering', 'cloud kitchen'],
      'Real Estate': ['real estate', 'property', 'housing', 'apartment', 'rental', 'mortgage', 'home', 'land', 'construction', 'interior', 'builder', 'developer'],
      'Education & Learning': ['education', 'learning', 'course', 'training', 'school', 'university', 'student', 'teacher', 'academic', 'certification', 'coaching', 'tutor'],
      'Finance & Banking': ['finance', 'banking', 'investment', 'loan', 'insurance', 'trading', 'stock', 'crypto', 'accounting', 'tax', 'financial advisor'],
      'E-commerce & Retail': ['ecommerce', 'retail', 'shopping', 'store', 'product', 'marketplace', 'online shopping', 'cart', 'checkout', 'shopify', 'woocommerce'],
      'Travel & Tourism': ['travel', 'tourism', 'hotel', 'flight', 'vacation', 'destination', 'tour', 'trip', 'booking', 'hospitality', 'resort', 'homestay'],
      'Marketing & Advertising': ['marketing', 'advertising', 'seo', 'social media', 'branding', 'content', 'digital marketing', 'campaign', 'ppc', 'lead generation'],
      'Automotive': ['car', 'automotive', 'vehicle', 'auto', 'motorcycle', 'electric vehicle', 'ev', 'driving', 'garage', 'car dealer', 'service center'],
      'Beauty & Cosmetics': ['beauty', 'cosmetics', 'skincare', 'makeup', 'salon', 'spa', 'hair', 'fragrance', 'grooming', 'parlor'],
      'Sports & Fitness': ['sports', 'fitness', 'gym', 'exercise', 'athlete', 'training', 'workout', 'running', 'cycling', 'personal trainer', 'yoga studio'],
      'Legal Services': ['legal', 'law', 'attorney', 'lawyer', 'court', 'litigation', 'compliance', 'contract', 'advocate', 'legal advisor'],
      'Manufacturing & Industrial': ['manufacturing', 'industrial', 'factory', 'production', 'supply chain', 'logistics', 'engineering', 'machinery'],
      'Hospitality': ['hotel', 'resort', 'homestay', 'guesthouse', 'booking', 'accommodation', 'hospitality', 'room service'],
      'Construction': ['construction', 'building', 'contractor', 'architect', 'interior design', 'renovation', 'civil engineering', 'home improvement'],
      'Consulting': ['consulting', 'advisory', 'strategy', 'management consulting', 'business consultant', 'consultant'],
      'Media & Entertainment': ['media', 'entertainment', 'film', 'music', 'production', 'studio', 'photography', 'videography', 'content creation'],
      'Agriculture': ['agriculture', 'farming', 'crop', 'livestock', 'organic', 'seeds', 'agricultural', 'farm'],
      'Logistics': ['logistics', 'shipping', 'courier', 'transport', 'freight', 'supply chain', 'delivery', 'warehouse'],
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
    // Templates are business-focused and work for specific niches
    const topicTemplates = [
      `The Complete Guide to ${n} in 2026: What Every Business Owner Should Know`,
      `Top 10 ${n} Trends That Will Define the Industry This Year`,
      `How to Choose the Right ${n} Provider: A Step-by-Step Buyer's Guide`,
      `${n} Mistakes That Cost Businesses Thousands (And How to Avoid Them)`,
      `The Ultimate ${n} Checklist for Professionals and Beginners`,
      `How ${n} is Evolving: Expert Predictions for the Next 5 Years`,
      `From Beginner to Expert: Your Complete ${n} Learning Roadmap`,
      `15 Expert Tips to Get the Most Out of Your ${n} Investment`,
      `${n} vs Alternatives: An Honest Comparison for Smart Buyers`,
      `The Hidden Costs of ${n} Nobody Warns You About`,
      `How to Build a Winning ${n} Strategy for Your Business`,
      `${n} for Small Businesses: A Practical Getting-Started Guide`,
      `What Research Says About ${n}: Data-Backed Insights`,
      `Case Study: How One Business Transformed Results with ${n}`,
      `Best ${n} Tools and Solutions Worth Using in 2026`,
      `The Real ROI of ${n}: Is the Investment Worth It?`,
      `Common ${n} Myths Debunked with Real-World Evidence`,
      `How to Stay Ahead of Competitors in the ${n} Space`,
      `${n} Best Practices: Lessons from Industry Leaders`,
      `A Day in the Life: What Working with ${n} Actually Looks Like`,
      `The Future of ${n}: Technology, Trends, and What's Next`,
      `How to Measure Success in ${n}: KPIs That Actually Matter`,
      `${n} on a Budget: Smart Strategies That Don't Compromise Quality`,
      `The Complete ${n} Glossary: Terms Every Client Should Know`,
      `How ${n} Directly Impacts Customer Experience and Loyalty`,
      `${n} Regulations and Compliance: What You Must Know`,
      `From Zero to Results: Building Your First ${n} Plan`,
      `The Psychology Behind Smart ${n} Decisions`,
      `${n} Trends by Region: A Practical Global Perspective`,
      `Your 30-Day ${n} Action Plan for Meaningful Results`,
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
