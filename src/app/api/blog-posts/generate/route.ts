import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { generateAIText } from '@/lib/ai-provider';
import { getBlogImage, replaceContentImages } from '@/lib/blog-images';

// AI Blog Agent - generates SEO-friendly blog posts with high-quality featured images
// (Pexels → Unsplash → Pollinations fallback) via unified AI provider (Gemini first)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { topic, keywords, tone, length, industry, language } = await req.json();
    if (!topic) return NextResponse.json({ error: 'Topic is required' }, { status: 400 });

    const langName = language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English';
    const wordCount = length === 'short' ? '400-500' : length === 'long' ? '1200-1500' : '700-900';

    const systemPrompt = `You are an expert SEO and AEO (Answer Engine Optimization) content writer. You write highly engaging, SEO-optimized blog posts that rank on Google, get cited by AI (ChatGPT, Perplexity, Gemini), and drive organic traffic.

CONTENT STRUCTURE (follow exactly):
1. Start with a DIRECT ANSWER paragraph (2-3 sentences answering the main query — for AEO/AI citation)
2. Then write the full article with this structure:
   - # Title (H1 with primary keyword)
   - ## Introduction (engaging hook + what reader will learn)
   - ## Main sections (H2) with ### subsections (H3) where needed
   - ## FAQ section (3-5 questions with direct answers)
   - ## Conclusion with strong CTA

RULES:
- Write in ${langName} language
- Write in ${tone || 'professional'} tone
- Target industry: ${industry || 'general business'}
- Word count: ${wordCount} words
- Each H2 section should be 150-300 words with actionable, specific content
- Use data, statistics, examples, and real-world scenarios
- Include a DIRECT ANSWER (40-60 words) right after the intro for AEO
- Optimize for primary keyword and LSI/related terms naturally
- Use EEAT signals: cite expertise, experience, data sources
- FAQ answers should be concise (2-3 sentences) for AI citation
- Write in CLEAN MARKDOWN: # for H1, ## for H2, ### for H3
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
- Include at least 2-3 statistics or data points
- Use real-world examples relevant to ${industry || 'the industry'}
- FAQ answers must be direct (2-3 sentences max)
- NO generic filler content
- NO image URLs in content`;

    // Generate blog content via unified AI provider (Gemini first, Pollinations fallback)
    let result;
    try {
      const aiRaw = await generateAIText(systemPrompt, userPrompt, { json: true });
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
      const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      result = {
        title: topic,
        slug,
        excerpt: `Learn about ${topic} - expert insights and actionable strategies for your business.`,
        content: `# ${topic}\n\nThis is a draft blog post about ${topic}. AI generation was temporarily unavailable. Please edit and complete this content manually.\n\n## Key Points\n\n- Point 1\n- Point 2\n- Point 3\n\n## Conclusion\n\nAdd your conclusion here.`,
        tags: [topic.toLowerCase().split(' ')[0]],
        category: industry || 'General Business',
      };
    }

    // Ensure SEO fields exist
    if (!result.seoScore) {
      // Calculate basic SEO score
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

    // Enhance tags with keyword extraction from title and content
    if (result.tags && Array.isArray(result.tags)) {
      // Extract additional keywords from title
      const titleWords: string[] = result.title?.split(/\s+/).filter((w: string) => w.length > 3) || [];
      const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'how', 'what', 'why', 'when', 'where', 'which', 'this', 'that', 'with', 'from', 'your', 'their', 'complete', 'guide', 'ultimate']);
      const keywordTags = titleWords
        .map((w: string) => w.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())
        .filter((w: string) => w.length > 3 && !stopWords.has(w));

      // Merge with existing tags, remove duplicates
      const allTags = [...new Set([...result.tags, ...keywordTags])];
      result.tags = allTags.slice(0, 10); // Max 10 tags for SEO
    }

    // Add hashtags to content for social media visibility
    if (result.content && result.tags?.length) {
      const hashtags = result.tags.slice(0, 5).map((t: string) => `#${t.replace(/\s+/g, '')}`).join(' ');
      if (!result.content.includes('#')) {
        result.content += `\n\n---\n\n**Share this article:** ${hashtags}`;
      }
    }

    // Attach a high-quality featured image (Pexels → Unsplash → Pollinations fallback)
    result.featuredImage = await getBlogImage(topic, industry);

    // Replace ALL AI-generated images in content with topic-relevant images
    // AI often inserts random Pexels URLs (red skirts, candles etc.) unrelated to topic
    if (result.content) {
      result.content = await replaceContentImages(result.content, topic, industry);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating blog post:', error);
    return NextResponse.json({ error: 'Failed to generate blog post' }, { status: 500 });
  }
}
