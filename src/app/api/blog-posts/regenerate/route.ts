import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateAIText } from '@/lib/ai-provider';
import { getVerifiedBlogImage } from '@/lib/blog-images';
import { generateScheduleNow } from '@/lib/schedule-generator';
import { isAdmin } from '@/lib/admin';
import { tidyBlogContent, blogQualityIssue, blogExcerpt, cleanBlogTags } from '@/lib/blog-quality';
import { assertToolCredits, chargeToolRun } from '@/lib/tool-charge';

// POST /api/blog-posts/regenerate?id=xxx
// Regenerates content + featured image for an existing blog post (fresh angle,
// same title/slug so published URLs stay stable)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { companyId: true } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    const scope = isAdmin(session.user.email) ? {} : { companyId: user.companyId };

    const { searchParams } = new URL(req.url);
    let bodyId: string | undefined;
    try { bodyId = ((await req.json()) as { id?: string }).id; } catch { /* id may come from query */ }
    const postId = searchParams.get('id') || bodyId;
    if (!postId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const affordable = await assertToolCredits(user.companyId, 'ai-blog-generate');
    if (!affordable.ok) {
      return NextResponse.json(
        { error: affordable.error, creditsRequired: affordable.cost, balance: affordable.balance },
        { status: 402 }
      );
    }

    const post = await prisma.blogPost.findFirst({ where: { id: postId, ...scope } });
    if (!post) {
      // Queued blogs are BlogSchedule rows — write the full article right now
      const schedule = await prisma.blogSchedule.findFirst({ where: { id: postId, ...scope } });
      if (!schedule) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      const result = await generateScheduleNow(schedule.id);
      if (result.status !== 'published') {
        return NextResponse.json({ error: 'The AI is busy right now — please try again in a moment.' }, { status: 502 });
      }
      const charge = await chargeToolRun(user.companyId, 'ai-blog-generate', 'AI blog regeneration');
      return NextResponse.json({
        ok: true,
        status: result.status,
        liveAt: result.liveAt,
        creditsUsed: charge.cost,
        creditsBalance: charge.balance,
      });
    }

    const systemPrompt = `You are an expert SEO content writer. Completely rewrite the given blog post with a fresh angle, practical examples and better structure. Keep the same title. Write at least 700 words with at least 4 substantive H2 sections, H3 subsections, an engaging intro, a 5-question FAQ and a useful CTA. Write in markdown; no duplicate H1 or inline images. Never invent citations, statistics, testimonials, company facts or case studies; label hypothetical scenarios clearly.

Respond in this exact JSON format (no other text):
{
  "excerpt": "150-160 char meta description",
  "content": "Full blog post in markdown",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;

    const userPrompt = `Blog title: "${post.title}"
Category: ${post.category || 'General'}
Existing tags: ${Array.isArray(post.tags) ? (post.tags as string[]).join(', ') : ''}

Write a completely new, publish-ready version of this post.`;

    const aiRaw = await generateAIText(systemPrompt, userPrompt, { json: true, timeoutMs: 180_000 });

    let data: { excerpt?: string; content?: string; tags?: string[] };
    try {
      data = JSON.parse(aiRaw);
    } catch {
      const match = aiRaw.replace(/```(?:json)?/gi, '').match(/\{[\s\S]*\}/);
      if (!match) return NextResponse.json({ error: 'Regeneration failed — please try again' }, { status: 502 });
      data = JSON.parse(match[0]);
    }

    const content = tidyBlogContent(data.content);
    const issue = blogQualityIssue(content);
    if (issue) return NextResponse.json({ error: `Regenerated article did not pass quality checks: ${issue}. The existing post is unchanged.` }, { status: 502 });

    // Fresh high-quality featured image (Pexels → Unsplash → Pollinations fallback)
    const featuredImage = await getVerifiedBlogImage(post.title, post.category || undefined);

    const updated = await prisma.blogPost.update({
      where: { id: postId },
      data: {
        excerpt: typeof data.excerpt === 'string' && data.excerpt.trim().length >= 40
          ? data.excerpt.trim().slice(0, 200) : blogExcerpt(content),
        content,
        tags: cleanBlogTags(data.tags?.length ? data.tags : post.tags),
        featuredImage,
      },
    });

    const charge = await chargeToolRun(user.companyId, 'ai-blog-generate', 'AI blog regeneration');
    return NextResponse.json({ ...updated, creditsUsed: charge.cost, creditsBalance: charge.balance });
  } catch (error) {
    console.error('Error regenerating blog post:', error);
    return NextResponse.json({ error: 'The AI is busy right now — please try again in a moment.' }, { status: 502 });
  }
}
