import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const [websites, posts, schedules] = await Promise.all([
      prisma.connectedWebsite.count({ where: { companyId: user.companyId, isActive: true } }),
      prisma.blogPost.count({ where: { companyId: user.companyId } }),
      prisma.blogSchedule.count({ where: { companyId: user.companyId } }),
    ]);

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
