import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Content Cluster Builder - groups blogs into topic clusters with pillar pages
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) return NextResponse.json({ error: 'Company ID required' }, { status: 400 });

    const posts = await prisma.blogPost.findMany({
      where: { companyId, status: 'published' },
      select: { id: true, title: true, slug: true, content: true, tags: true, category: true, publishedAt: true }
    });

    const clusters: Record<string, { pillar: any; clusters: any[] }> = {};

    posts.forEach(post => {
      const tags = post.tags as string[] || [];
      const topic = tags[0] || post.category || 'General';

      if (!clusters[topic]) {
        clusters[topic] = { pillar: null, clusters: [] };
      }

      const wordCount = (post.content || '').split(/\s+/).length;

      if (wordCount > 2000) {
        clusters[topic].pillar = {
          id: post.id,
          title: post.title,
          slug: post.slug,
          wordCount,
          publishedAt: post.publishedAt
        };
      } else {
        clusters[topic].clusters.push({
          id: post.id,
          title: post.title,
          slug: post.slug,
          wordCount,
          publishedAt: post.publishedAt
        });
      }
    });

    const result = Object.entries(clusters).map(([topic, data]) => {
      const totalWords = data.clusters.reduce((sum, b) => sum + b.wordCount, 0) + (data.pillar?.wordCount || 0);
      const clusterCount = data.clusters.length;
      const hasPillar = !!data.pillar;
      
      let score = 0;
      if (hasPillar) score += 30;
      score += Math.min(40, clusterCount * 10);
      score += Math.min(30, totalWords / 100);
      
      return {
        topic,
        pillar: data.pillar,
        clusters: data.clusters,
        clusterCount,
        totalWords,
        authorityScore: Math.round(Math.min(100, score))
      };
    });

    result.sort((a, b) => b.authorityScore - a.authorityScore);

    return NextResponse.json({ clusters: result });
  } catch (error) {
    console.error('Content clusters error:', error);
    return NextResponse.json({ error: 'Failed to build clusters' }, { status: 500 });
  }
}
