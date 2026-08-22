import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

// AI Blog Agent - generates SEO-friendly blog posts with featured images using Pollinations.ai (100% free)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { topic, keywords, tone, length, industry } = await req.json();
    if (!topic) return NextResponse.json({ error: 'Topic is required' }, { status: 400 });

    const wordCount = length === 'short' ? '400-500' : length === 'long' ? '1200-1500' : '700-900';

    const systemPrompt = `You are an expert SEO and AEO (Answer Engine Optimization) content writer and blog agent. You write highly engaging, SEO-optimized blog posts that rank on Google, get cited by AI (ChatGPT, Perplexity, Gemini), and drive organic traffic.

Rules:
- Write in ${tone || 'professional'} tone
- Target industry: ${industry || 'general business'}
- Word count: ${wordCount} words
- Include a compelling meta description (150-160 characters) with primary keyword
- Include 5-8 relevant tags
- Use proper H2 and H3 headings for structure
- Include an engaging introduction and strong conclusion with CTA
- Optimize for the primary keyword and related terms
- Write in markdown format with proper headings (# for title, ## for H2, ### for H3)
- Make it actionable and valuable for readers
- Suggest a category for this post (e.g., Technology, Marketing, Business, SEO, AI, Startups, etc.)
- Include FAQ section (3-5 questions) for AEO/AI citation optimization
- Use EEAT signals (expertise, experience, authoritativeness, trustworthiness)
- Include internal linking suggestions and external authority links

You must respond in this exact JSON format (no other text):
{
  "title": "SEO-optimized compelling title with keyword",
  "slug": "url-friendly-slug",
  "excerpt": "150-160 char meta description with primary keyword",
  "content": "Full blog post in markdown with headings, FAQ section, and CTA",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "category": "Most relevant category",
  "seoScore": 85,
  "seoTips": ["Tip 1", "Tip 2", "Tip 3"]
}`;

    const userPrompt = `Write an SEO and AEO optimized blog post about: "${topic}"
${keywords ? `Primary keywords: ${keywords}` : ''}
${industry ? `Industry: ${industry}` : ''}

Requirements:
- Optimize for Google search ranking (SEO)
- Optimize for AI citation by ChatGPT, Perplexity, Gemini (AEO)
- Include FAQ section with 3-5 commonly asked questions
- Use EEAT signals throughout
- Include a strong CTA at the end
- Make it rank on Google AND get cited by AI engines.`;

    // Generate blog content via Pollinations
    const pollinationsRes = await fetch('https://text.pollinations.ai/', {
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

    let result;
    if (pollinationsRes.ok) {
      const text = await pollinationsRes.text();
      try {
        result = JSON.parse(text);
      } catch {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          result = {
            title: topic,
            slug,
            excerpt: text.substring(0, 160),
            content: text,
            tags: [topic.toLowerCase().split(' ')[0], 'blog', 'seo'],
            category: industry || 'General Business',
          };
        }
      }
    } else {
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

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating blog post:', error);
    return NextResponse.json({ error: 'Failed to generate blog post' }, { status: 500 });
  }
}
