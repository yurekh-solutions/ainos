import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const companyId = user.companyId;

    // Blogs are linked to a company through BlogSchedule (BlogPost.companyId is
    // not reliably populated), so count published posts via the company's
    // schedules — the same source of truth the Blog page uses.
    const [websites, schedules, schedPosts] = await Promise.all([
      prisma.connectedWebsite.count({ where: { companyId, isActive: true } }),
      prisma.blogSchedule.count({ where: { companyId } }),
      prisma.blogSchedule.findMany({ where: { companyId, blogPostId: { not: null } }, select: { blogPostId: true } }),
    ]);

    const postIds = Array.from(new Set(schedPosts.map(s => s.blogPostId).filter(Boolean) as string[]));
    const posts = postIds.length > 0 ? await prisma.blogPost.count({ where: { id: { in: postIds } } }) : 0;

    return NextResponse.json({
      websites,
      posts,
      schedules,
    });
  } catch (error) {
    console.error('SEO overview error:', error);
    return NextResponse.json({ error: 'Failed to load overview' }, { status: 500 });
  }
}
