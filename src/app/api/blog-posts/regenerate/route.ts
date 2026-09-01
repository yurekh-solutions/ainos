import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateAIText } from '@/lib/ai-provider';
import { getBlogImage } from '@/lib/blog-images';

// POST /api/blog-posts/regenerate?id=xxx
// Regenerates content + featured image for an existing blog post (fresh angle,
// same title/slug so published URLs stay stable)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    let bodyId: string | undefined;
    try { bodyId = ((await req.json()) as { id?: string }).id; } catch { /* id may come from query */ }
    const postId = searchParams.get('id') || bodyId;
    if (!postId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const post = await prisma.blogPost.findUnique({ where: { id: postId } });
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    const systemPrompt = `You are an expert SEO content writer. Completely rewrite the given blog post with a fresh angle, new examples and better structure. Keep the same title. Include proper H2/H3 headings, an engaging intro, a 5-question FAQ section, EEAT signals and a strong CTA. Write in markdown.

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

    const aiRaw = await generateAIText(systemPrompt, userPrompt, { json: true });

    let data: { excerpt?: string; content?: string; tags?: string[] };
    try {
      data = JSON.parse(aiRaw);
    } catch {
      const match = aiRaw.replace(/```(?:json)?/gi, '').match(/\{[\s\S]*\}/);
      if (!match) return NextResponse.json({ error: 'Regeneration failed — please try again' }, { status: 502 });
      data = JSON.parse(match[0]);
    }

    if (!data.content) return NextResponse.json({ error: 'Regeneration returned empty content' }, { status: 502 });

    // Fresh high-quality featured image (Pexels → Unsplash → Pollinations fallback)
    const featuredImage = await getBlogImage(post.title);

    const updated = await prisma.blogPost.update({
      where: { id: postId },
      data: {
        excerpt: data.excerpt || post.excerpt,
        content: data.content,
        tags: data.tags && data.tags.length ? data.tags : (post.tags || []),
        featuredImage,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error regenerating blog post:', error);
    return NextResponse.json({ error: 'Failed to regenerate blog post' }, { status: 500 });
  }
}
