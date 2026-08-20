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

    const systemPrompt = `You are an expert SEO content writer and blog agent. You write highly engaging, SEO-optimized blog posts that rank on Google and drive organic traffic.

Rules:
- Write in ${tone || 'professional'} tone
- Target industry: ${industry || 'general business'}
- Word count: ${wordCount} words
- Include a compelling meta description (150-160 characters)
- Include 5-8 relevant tags
- Use proper H2 and H3 headings for structure
- Include an engaging introduction and strong conclusion with CTA
- Optimize for the primary keyword and related terms
- Write in markdown format with proper headings (# for title, ## for H2, ### for H3)
- Make it actionable and valuable for readers
- Suggest a category for this post (e.g., Technology, Marketing, Business, SEO, AI, Startups, etc.)

You must respond in this exact JSON format (no other text):
{
  "title": "SEO-optimized compelling title",
  "slug": "url-friendly-slug",
  "excerpt": "150-160 char meta description for SEO",
  "content": "Full blog post in markdown format with headings",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "category": "Most relevant category"
}`;

    const userPrompt = `Write an SEO-optimized blog post about: "${topic}"
${keywords ? `Primary keywords: ${keywords}` : ''}
${industry ? `Industry: ${industry}` : ''}

Make it rank on Google, engage readers, and drive organic traffic. Include a strong CTA at the end.`;

    // Generate blog content and featured image in parallel
    const [pollinationsRes, imageUrl] = await Promise.all([
      fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      }),
      // Generate featured image via Pollinations.ai (free, no API key)
      Promise.resolve(
        `https://image.pollinations.ai/prompt/${encodeURIComponent(
          `Professional blog header image about ${topic}, modern business concept, clean design, high quality, 16:9 aspect ratio`
        )}?width=1200&height=630&nologo=true&seed=${Date.now()}`
      ),
    ]);

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

    // Attach the generated featured image URL
    result.featuredImage = imageUrl;

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating blog post:', error);
    return NextResponse.json({ error: 'Failed to generate blog post' }, { status: 500 });
  }
}
