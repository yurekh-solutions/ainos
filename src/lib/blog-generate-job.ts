import { generateAIText } from '@/lib/ai-provider';
import { getVerifiedBlogImage } from '@/lib/blog-images';
import { tidyBlogContent, blogQualityIssue, blogExcerpt, cleanBlogTags } from '@/lib/blog-quality';
import { chargeToolRun } from '@/lib/tool-charge';
import { registerJobHandler } from '@/lib/job-queue';

/**
 * ASYNC BLOG GENERATION JOB (Phase 2 migration of /api/blog-posts/generate).
 *
 * The synchronous route was the primary 502 source: generateAIText runs with a
 * 180s budget plus a multi-provider featured-image check — well past Render's
 * ~55s gateway ceiling. The route now does auth/validation/credit-affordability
 * inline (so 401/400/402 stay instant) and hands this handler the slow part,
 * detached. Credits are charged ONLY on success (chargeToolRun at the end), and
 * a quality/generation failure throws so the job is marked failed and the user
 * is never charged — matching the old route's pre-charge 502 branches.
 */

export interface BlogGeneratePayload {
  companyId: string | null;
  topic: string;
  keywords?: string;
  tone?: string;
  length?: string;
  industry?: string;
  language?: string;
}

export type BlogGenerateResult = Record<string, unknown> & {
  creditsUsed?: number;
  creditsBalance?: number | null;
};

const SYSTEM_PROMPT_BASE = `You are an expert SEO and AEO (Answer Engine Optimization) content writer. You write highly engaging, SEO-optimized blog posts that rank on Google, get cited by AI (ChatGPT, Perplexity, Gemini), and drive organic traffic.

CONTENT STRUCTURE (follow exactly):
1. Start with a DIRECT ANSWER paragraph (2-3 sentences answering the main query — for AEO/AI citation)
2. Then write the full article with this structure:
   - Put the title only in the JSON title field, not an H1 inside content
   - ## Introduction (engaging hook + what reader will learn)
   - ## Main sections (H2) with ### subsections (H3) where needed
   - ## FAQ section (3-5 questions with direct answers)
   - ## Conclusion with strong CTA

RULES:
- Write in LANG language
- Write in TONE tone
- Target industry: INDUSTRY
- Word count: WORDCOUNT words
- Each H2 section should be 150-300 words with actionable, specific content
- Use specific practical examples. Never fabricate statistics, citations, company claims, or testimonials. Label hypothetical scenarios clearly.
- Include a DIRECT ANSWER (40-60 words) right after the intro for AEO
- Optimize for primary keyword and LSI/related terms naturally
- Use EEAT signals: cite expertise, experience, data sources
- FAQ answers should be concise (2-3 sentences) for AI citation
- Write in CLEAN MARKDOWN: ## for H2, ### for H3. Include at least MINH2 useful H2 sections.
- Use bullet points and numbered lists where appropriate
- Include a strong CTA at the end

CRITICAL: Do NOT include any image URLs or ![markdown images] in the content. Images are handled separately.

You must respond in this exact JSON format (no other text):
{
  "title": "SEO-optimized compelling title with primary keyword (50-60 chars)",
  "slug": "url-friendly-slug-with-keywords",
  "excerpt": "Compelling meta description with primary keyword (150-160 chars)",
  "content": "Full blog post in clean markdown. NO image URLs. Start with direct answer paragraph, then ## sections.",
  "tags": ["primary-keyword", "related-term-1", "related-term-2", "related-term-3", "related-term-4"],
  "category": "Most relevant category",
  "seoScore": 85,
  "seoTips": ["Specific actionable tip 1", "Specific actionable tip 2", "Specific actionable tip 3"]
}`;

registerJobHandler<BlogGenerateResult, BlogGeneratePayload>('blog_generate', async (payload) => {
  const { companyId, topic, keywords, tone, length, industry, language } = payload;

  const langName = language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English';
  const wordCount = length === 'short' ? '400-500' : length === 'long' ? '1200-1500' : length === 'extra-long' ? '2800-3200' : '700-900';

  const systemPrompt = SYSTEM_PROMPT_BASE
    .replace('LANG', langName)
    .replace('TONE', tone || 'professional')
    .replace('INDUSTRY', industry || 'general business')
    .replace('WORDCOUNT', wordCount)
    .replace('MINH2', length === 'short' ? '3' : '4');

  const userPrompt = `Write an SEO and AEO optimized blog post about: "${topic}"
${keywords ? `Primary keywords: ${keywords}` : ''}
${industry ? `Industry: ${industry}` : ''}

PIPELINE:
1. Research: Understand the topic deeply
2. Direct Answer: Write a 40-60 word direct answer first (for AI citation)
3. Outline: Create 4-6 H2 sections covering the topic comprehensively
4. Content: Write 150-300 words per section with data, examples, actionable tips
5. FAQ: Add 3-5 questions with concise answers
6. CTA: Strong conclusion with call-to-action

QUALITY CHECKS:
- Every H2 section must have SPECIFIC, ACTIONABLE content (not fluff)
- Include practical examples; only include statistics with a reliable source, never invent them
- Use real-world examples relevant to ${industry || 'the industry'}
- FAQ answers must be direct (2-3 sentences max)
- NO generic filler content
- NO image URLs in content`;

  // Generate blog content via unified AI provider (Gemini first, Pollinations fallback)
  let result: Record<string, unknown> & { content?: string; title?: string; tags?: string[]; excerpt?: string };
  try {
    const aiRaw = await generateAIText(systemPrompt, userPrompt, { json: true, timeoutMs: 180_000 });
    try {
      result = JSON.parse(aiRaw);
    } catch {
      const jsonMatch = aiRaw.replace(/```(?:json)?/gi, '').match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        result = {
          title: topic,
          slug,
          excerpt: aiRaw.substring(0, 160),
          content: aiRaw,
          tags: [topic.toLowerCase().split(' ')[0], 'blog', 'seo'],
          category: industry || 'General Business',
        };
      }
    }
  } catch {
    throw new Error('Article generation is unavailable right now. Please try again.');
  }

  result.content = tidyBlogContent(result.content);
  const issue = blogQualityIssue(result.content, length === 'short' ? 400 : 700, length === 'short' ? 3 : 4);
  if (issue) throw new Error(`Article did not pass quality checks: ${issue}. Please retry.`);
  result.tags = cleanBlogTags(result.tags);
  result.title = typeof result.title === 'string' && result.title.trim() ? result.title.trim() : topic;
  result.excerpt = typeof result.excerpt === 'string' && result.excerpt.trim().length >= 40
    ? result.excerpt.trim().slice(0, 200) : blogExcerpt(result.content);

  // Structural checklist score, not a predicted search ranking.
  {
    let score = 50;
    const tips: string[] = [];
    if (result.title && result.title.length >= 40 && result.title.length <= 60) { score += 10; } else { tips.push('Title should be 40-60 characters'); }
    if (result.excerpt && result.excerpt.length >= 140 && result.excerpt.length <= 160) { score += 10; } else { tips.push('Meta description should be 140-160 characters'); }
    if (result.content && result.content.includes('## ')) { score += 10; } else { tips.push('Add H2 headings for structure'); }
    if (result.content && result.content.length > 1000) { score += 10; } else { tips.push('Content should be longer (800+ words)'); }
    if (result.tags && result.tags.length >= 5) { score += 5; } else { tips.push('Add more tags (5-8 recommended)'); }
    if (result.content && /FAQ|faq|frequently/i.test(result.content)) { score += 5; tips.push('Great: FAQ section detected for AEO'); } else { tips.push('Add FAQ section for AI citation (AEO)'); }
    result.seoScore = Math.min(score, 98);
    result.seoTips = tips.length > 0 ? tips : ['Looking good! All SEO checks passed.'];
  }

  // Enhance tags with keyword extraction from title.
  if (result.tags && Array.isArray(result.tags)) {
    const titleWords: string[] = result.title?.split(/\s+/).filter((w: string) => w.length > 3) || [];
    const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'how', 'what', 'why', 'when', 'where', 'which', 'this', 'that', 'with', 'from', 'your', 'their', 'complete', 'guide', 'ultimate']);
    const keywordTags = titleWords
      .map((w: string) => w.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())
      .filter((w: string) => w.length > 3 && !stopWords.has(w));
    const allTags = [...new Set([...result.tags, ...keywordTags])];
    result.tags = allTags.slice(0, 10);
  }

  // Add hashtags to content for social visibility.
  if (result.content && result.tags?.length) {
    const hashtags = result.tags.slice(0, 5).map((t: string) => `#${t.replace(/\s+/g, '')}`).join(' ');
    if (!result.content.includes('#')) {
      result.content += `\n\n---\n\n**Share this article:** ${hashtags}`;
    }
  }

  result.tags = cleanBlogTags(result.tags);
  // A failed image check is an error, never a successful blog with a broken URL.
  result.featuredImage = await getVerifiedBlogImage(topic, industry);

  const charge = await chargeToolRun(companyId, 'ai-blog-generate', 'AI blog article');
  return { ...result, creditsUsed: charge.cost, creditsBalance: charge.balance };
});
