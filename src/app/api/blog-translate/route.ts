import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateAIText } from '@/lib/ai-provider';

// Multi-Language Blog Translation - translates blogs to Hindi, Marathi, Spanish, etc.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { blogId, targetLang } = await req.json();
    if (!blogId || !targetLang) {
      return NextResponse.json({ error: 'Blog ID and target language required' }, { status: 400 });
    }

    const post = await prisma.blogPost.findUnique({ where: { id: blogId } });
    if (!post) return NextResponse.json({ error: 'Blog not found' }, { status: 404 });

    const langMap: Record<string, string> = {
      'hi': 'Hindi',
      'mr': 'Marathi',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'ar': 'Arabic',
      'pt': 'Portuguese',
      'ja': 'Japanese'
    };

    const langName = langMap[targetLang];
    if (!langName) {
      return NextResponse.json({ error: 'Unsupported language' }, { status: 400 });
    }

    const content = post.content || '';

    const systemPrompt = `You are a professional translator. Translate content to ${langName} while preserving markdown format.`;
    const userPrompt = `Translate this blog post to ${langName}.

Rules:
- Keep the same markdown format (headings, lists, bold, italic)
- Keep URLs and code blocks unchanged
- Translate only the text content
- Maintain the same tone and style
- Keep FAQ section format intact

Blog Title: ${post.title}
Content:
${content}`;

    const translated = await generateAIText(systemPrompt, userPrompt);

    // Check if translation already exists
    const existingSlug = `${post.slug}-${targetLang}`;
    const existing = await prisma.blogPost.findUnique({ where: { slug: existingSlug } });

    if (existing) {
      // Update existing translation
      await prisma.blogPost.update({
        where: { id: existing.id },
        data: { content: translated, publishedAt: new Date() }
      });
      return NextResponse.json({ success: true, slug: existingSlug, updated: true });
    }

    // Create new translation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.blogPost.create as any)({
      data: {
        title: post.title,
        slug: existingSlug,
        content: translated,
        excerpt: post.excerpt,
        category: post.category,
        tags: post.tags,
        language: targetLang,
        status: 'published',
        companyId: post.companyId,
        featuredImage: post.featuredImage
      }
    });

    return NextResponse.json({ success: true, slug: existingSlug, updated: false });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: 'Failed to translate blog' }, { status: 500 });
  }
}
