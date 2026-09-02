import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Smart Internal Linking - suggests relevant internal links based on keyword matching
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { blogId, companyId } = await req.json();
    if (!blogId || !companyId) {
      return NextResponse.json({ error: 'Blog ID and Company ID required' }, { status: 400 });
    }

    const currentPost = await prisma.blogPost.findUnique({ where: { id: blogId } });
    if (!currentPost) return NextResponse.json({ error: 'Blog not found' }, { status: 404 });

    const currentContent = currentPost.content || '';
    const currentKeywords = extractKeywords(currentContent);

    // Get all published blogs from same company
    const allPosts = await prisma.blogPost.findMany({
      where: { companyId, status: 'published', id: { not: blogId } },
      select: { id: true, title: true, slug: true, content: true, tags: true, category: true }
    });

    const suggestions: Array<{
      blogId: string;
      slug: string;
      title: string;
      anchorText: string;
      relevance: number;
      category: string | null;
    }> = [];

    for (const post of allPosts) {
      const postContent = post.content || '';
      const postKeywords = extractKeywords(postContent);

      // Find common keywords
      const common = currentKeywords.filter(k => postKeywords.includes(k));

      if (common.length >= 2) {
        // Find anchor text in current blog
        const anchorText = findKeywordInText(common[0], currentContent);

        suggestions.push({
          blogId: post.id,
          slug: post.slug,
          title: post.title,
          anchorText: anchorText.substring(0, 40),
          relevance: common.length,
          category: post.category
        });
      }
    }

    // Sort by relevance and return top 5
    const topSuggestions = suggestions
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 5);

    return NextResponse.json({ suggestions: topSuggestions });
  } catch (error) {
    console.error('Internal linking error:', error);
    return NextResponse.json({ error: 'Failed to suggest links' }, { status: 500 });
  }
}

// Extract keywords from text (simple frequency-based)
function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const stopWords = new Set([
    'this', 'that', 'with', 'from', 'they', 'have', 'been', 'your', 'their',
    'what', 'which', 'when', 'where', 'why', 'how', 'also', 'more', 'than',
    'into', 'over', 'after', 'before', 'between', 'under', 'during', 'through'
  ]);

  const freq: Record<string, number> = {};
  words.forEach(w => {
    if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1;
  });

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([word]) => word);
}

// Find keyword in text and return surrounding context
function findKeywordInText(keyword: string, text: string): string {
  const regex = new RegExp(`[^.]*${keyword}[^.]*\\.`, 'i');
  const match = text.match(regex);
  if (match) {
    const sentence = match[0].trim();
    // Find the keyword position and return a short phrase
    const idx = sentence.toLowerCase().indexOf(keyword.toLowerCase());
    const start = Math.max(0, idx - 20);
    const end = Math.min(sentence.length, idx + keyword.length + 30);
    return sentence.substring(start, end).trim();
  }
  return keyword;
}
