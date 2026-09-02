import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Drip Email Campaign Builder - converts blog series into email sequences
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { blogIds, intervalDays, campaignName } = await req.json();
    if (!blogIds || !Array.isArray(blogIds) || blogIds.length === 0) {
      return NextResponse.json({ error: 'Blog IDs array required' }, { status: 400 });
    }

    const interval = intervalDays || 2;
    const posts = await prisma.blogPost.findMany({
      where: { id: { in: blogIds } },
      select: { id: true, title: true, slug: true, excerpt: true, category: true }
    });

    if (posts.length === 0) {
      return NextResponse.json({ error: 'No blogs found' }, { status: 404 });
    }

    // Build email sequence
    const emails = posts.map((post, i) => ({
      day: i * interval,
      subject: `Day ${i + 1}: ${post.title}`,
      preview: post.excerpt || `${post.title} - Learn more in this comprehensive guide.`,
      blogSlug: post.slug,
      blogId: post.id
    }));

    const campaign = {
      name: campaignName || `${posts[0].category || 'Blog'} Mastery Course`,
      totalEmails: emails.length,
      totalDays: emails[emails.length - 1].day + 1,
      emails
    };

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('Drip campaign error:', error);
    return NextResponse.json({ error: 'Failed to build campaign' }, { status: 500 });
  }
}

// GET - List all campaigns for a company
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) return NextResponse.json({ error: 'Company ID required' }, { status: 400 });

    // For now, return empty array (campaigns stored in memory)
    // Can be extended to store in database
    return NextResponse.json({ campaigns: [] });
  } catch (error) {
    console.error('Campaign list error:', error);
    return NextResponse.json({ error: 'Failed to load campaigns' }, { status: 500 });
  }
}
