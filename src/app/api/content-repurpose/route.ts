import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { generateAIText } from '@/lib/ai-provider';
import { prisma } from '@/lib/prisma';

// AI Content Repurposing - Convert blog into multiple social media formats
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { slug, formats } = await req.json();
    if (!slug) return NextResponse.json({ error: 'Slug is required' }, { status: 400 });

    const post = await prisma.blogPost.findFirst({
      where: { slug, status: 'published' },
    });

    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    const requestedFormats = formats || ['twitter', 'linkedin', 'instagram', 'email'];
    const results: Record<string, string> = {};

    // Twitter Thread (5-7 tweets)
    if (requestedFormats.includes('twitter')) {
      const twitterPrompt = `Convert this blog post into a compelling Twitter thread (5-7 tweets).

Blog Title: ${post.title}
Blog Content: ${post.content?.substring(0, 3000)}

Requirements:
- Tweet 1: Hook that grabs attention (use emoji, ask question, or share surprising stat)
- Tweets 2-6: Key insights from the blog, one per tweet
- Each tweet: 280 chars max, include relevant hashtags
- Final tweet: CTA with link to full blog
- Use line breaks for readability
- Add emojis strategically (not overdone)
- Make it conversational and engaging

Format as JSON array:
{
  "tweets": ["Tweet 1 text", "Tweet 2 text", ...],
  "hook": "Attention-grabbing opening",
  "hashtags": ["#tag1", "#tag2"]
}`;

      try {
        const twitterRaw = await generateAIText(
          'You are a Twitter content expert who creates viral threads.',
          twitterPrompt,
          { json: true }
        );
        results.twitter = twitterRaw;
      } catch (err) {
        console.error('Twitter generation error:', err);
        results.twitter = JSON.stringify({ error: 'Failed to generate Twitter thread' });
      }
    }

    // LinkedIn Post
    if (requestedFormats.includes('linkedin')) {
      const linkedinPrompt = `Convert this blog post into a professional LinkedIn post.

Blog Title: ${post.title}
Blog Content: ${post.content?.substring(0, 3000)}

Requirements:
- Start with a compelling hook (first 2 lines visible before "see more")
- Use short paragraphs (1-2 sentences each)
- Include 3-5 key takeaways as bullet points
- Add relevant emojis (professional, not excessive)
- End with a question to drive engagement
- Include 3-5 relevant hashtags at the end
- 1300 characters max (LinkedIn sweet spot)
- Professional but conversational tone
- Use line breaks for readability

Format as JSON:
{
  "post": "Full LinkedIn post text",
  "hook": "First 2 lines (the hook)",
  "hashtags": ["#tag1", "#tag2"]
}`;

      try {
        const linkedinRaw = await generateAIText(
          'You are a LinkedIn content strategist who creates engaging professional posts.',
          linkedinPrompt,
          { json: true }
        );
        results.linkedin = linkedinRaw;
      } catch (err) {
        console.error('LinkedIn generation error:', err);
        results.linkedin = JSON.stringify({ error: 'Failed to generate LinkedIn post' });
      }
    }

    // Instagram Carousel (10 slides)
    if (requestedFormats.includes('instagram')) {
      const instagramPrompt = `Convert this blog post into an Instagram carousel (10 slides).

Blog Title: ${post.title}
Blog Content: ${post.content?.substring(0, 3000)}

Requirements:
- Slide 1: Title + hook (grab attention)
- Slides 2-9: One key point per slide (concise, visual-friendly)
- Slide 10: CTA + hashtags
- Each slide: 100-150 words max
- Use emojis for visual appeal
- Include design suggestions (colors, layout)
- Make it scannable and shareable

Format as JSON:
{
  "slides": [
    {"slide": 1, "title": "Title", "content": "Text", "design": "Design suggestion"},
    ...
  ],
  "caption": "Instagram caption with hashtags",
  "hashtags": ["#tag1", "#tag2"]
}`;

      try {
        const instagramRaw = await generateAIText(
          'You are an Instagram content creator who designs viral carousels.',
          instagramPrompt,
          { json: true }
        );
        results.instagram = instagramRaw;
      } catch (err) {
        console.error('Instagram generation error:', err);
        results.instagram = JSON.stringify({ error: 'Failed to generate Instagram carousel' });
      }
    }

    // Email Newsletter
    if (requestedFormats.includes('email')) {
      const emailPrompt = `Convert this blog post into an engaging email newsletter.

Blog Title: ${post.title}
Blog Content: ${post.content?.substring(0, 3000)}

Requirements:
- Subject line: 50-60 chars, compelling, curiosity-driven
- Preview text: 100-150 chars
- Opening: Personal, conversational
- Body: 3-5 key insights with brief explanations
- Use bullet points for scannability
- Include 1-2 relevant links
- CTA: Clear, action-oriented
- Sign-off: Professional but warm
- 500-700 words total

Format as JSON:
{
  "subject": "Email subject line",
  "preview": "Preview text",
  "content": "Full email content in HTML",
  "cta": "Call-to-action text",
  "ctaLink": "Link URL"
}`;

      try {
        const emailRaw = await generateAIText(
          'You are an email marketing expert who writes high-converting newsletters.',
          emailPrompt,
          { json: true }
        );
        results.email = emailRaw;
      } catch (err) {
        console.error('Email generation error:', err);
        results.email = JSON.stringify({ error: 'Failed to generate email newsletter' });
      }
    }

    return NextResponse.json({
      success: true,
      postTitle: post.title,
      postSlug: post.slug,
      repurposed: results,
    });
  } catch (error) {
    console.error('Content repurposing error:', error);
    return NextResponse.json({ error: 'Failed to repurpose content' }, { status: 500 });
  }
}
