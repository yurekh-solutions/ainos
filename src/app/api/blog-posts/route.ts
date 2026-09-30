import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';
import { startBackgroundGeneration } from '@/lib/schedule-generator';
import { autoShareBlog } from '@/lib/social-share';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const websiteId = searchParams.get('websiteId');
    const platform = searchParams.get('platform') === 'true' && isAdmin(session.user.email);

    // Platform mode: admin sees ALL blogs across all companies (no companyId filter)
    const where: Record<string, unknown> = platform ? {} : { companyId: user.companyId };
    if (status) where.status = status;
    if (category && category !== 'All') where.category = category;
    if (websiteId) {
      // Get ALL blog IDs from schedules for this website (including published)
      const allSchedules = await prisma.blogSchedule.findMany({
        where: { connectedWebsiteId: websiteId, companyId: user.companyId },
        select: { blogPostId: true },
      });
      const blogIds = allSchedules.map(s => s.blogPostId).filter(Boolean) as string[];
      if (blogIds.length > 0) {
        where.id = { in: blogIds };
      } else {
        // No blog posts yet for this website
        where.id = { in: [] };
      }
    }

    const posts = await prisma.blogPost.findMany({
      where,
      include: platform ? {
        company: { select: { name: true, id: true } },
      } : undefined,
      orderBy: { createdAt: 'desc' }
    });

    // Also fetch scheduled blogs from BlogSchedule.
    // Show pending/generating only — hide failed/cancelled (bad UX)
    const scheduleWhere: Record<string, unknown> = platform ? {} : { companyId: user.companyId };
    scheduleWhere.status = { in: ['pending', 'generating'] };
    if (websiteId) scheduleWhere.connectedWebsiteId = websiteId;
    let schedules = [] as unknown as Array<{
      id: string;
      topic: string;
      keywords: string | null;
      status: string;
      previewImage: string | null;
      companyId: string | null;
      scheduledDate: Date;
      createdAt: Date;
      subscription: {
        connectedWebsite: {
          niche: string | null;
        } | null;
      } | null;
      company?: { name: string | null; id: string } | null;
    }>;
    // Always fetch schedules when websiteId is provided (show all blogs for that website)
    // Otherwise only fetch when no status filter or status is 'scheduled'
    if (websiteId || !status || status === 'scheduled') {
      schedules = await prisma.blogSchedule.findMany({
        where: scheduleWhere,
        include: {
          subscription: {
            include: {
              connectedWebsite: true,
            },
          },
          ...(platform ? { company: { select: { name: true, id: true } } } : {}),
        },
        orderBy: { scheduledDate: 'desc' },
      }) as unknown as typeof schedules;
    }

    // Auto-start background writing for any company that still has queued blogs —
    // no user clicks needed; published articles appear as they are written
    const pendingCompanies = new Set<string>();
    schedules.forEach(s => { if (s.status === 'pending' && s.companyId) pendingCompanies.add(s.companyId); });
    if (!platform && user.companyId) pendingCompanies.add(user.companyId);
    console.log(`[Blog Posts API] Pending companies: ${[...pendingCompanies].join(', ') || 'none'}`);
    console.log(`[Blog Posts API] Total schedules: ${schedules.length}, Pending: ${schedules.filter(s => s.status === 'pending').length}`);
    pendingCompanies.forEach(cid => {
      const started = startBackgroundGeneration(cid);
      console.log(`[Blog Posts API] startBackgroundGeneration(${cid}) = ${started}`);
    });

    // Convert schedules to blog post format for unified display.
    // Queued cards get a readable content preview built from the site's
    // niche + keywords so every card shows heading, content and image.
    const scheduledPosts = schedules.map((s) => {
      const niche = s.subscription?.connectedWebsite?.niche || 'Business';
      const kwList = s.keywords
        ? (s.keywords as string).split(',').map(k => k.trim())
            .filter(k => k && k.toLowerCase() !== niche.toLowerCase())
        : [];
      const teaser = kwList.slice(0, 3).join(', ');

      // Derive category from topic keywords, not just niche
      const topicWords = s.topic.split(/[^a-zA-Z0-9]+/).filter(w => w.length > 3);
      const categoryKeywords = ['Marketing', 'Branding', 'Design', 'SEO', 'Social Media', 'Content', 'Strategy', 'Analytics', 'Advertising', 'Consulting', 'Franchise', 'PPC', 'Landing', 'UI', 'UX', 'B2B', 'SaaS', 'Startup', 'Growth', 'Leadership', 'Management', 'Finance', 'Legal', 'Technology', 'Innovation'];
      const matchedCategory = categoryKeywords.find(cat =>
        topicWords.some(w => w.toLowerCase() === cat.toLowerCase()) ||
        s.topic.toLowerCase().includes(cat.toLowerCase())
      );
      const category = matchedCategory || niche.split(' ').slice(0, 2).join(' ') || 'Business';

      // Tags: use topic-specific keywords, not just niche
      const topicTags = topicWords
        .filter(w => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'how', 'what', 'which', 'their', 'this', 'that', 'with', 'from', 'have', 'been', 'will', 'each', 'make', 'like', 'long', 'look', 'many', 'some', 'them', 'then', 'than', 'into', 'more', 'also', 'just', 'over', 'such', 'take', 'year', 'very', 'when', 'come', 'could', 'other', 'after', 'most', 'about', 'would', 'there', 'so', 'up', 'if', 'of', 'in', 'to', 'is', 'it', 'as', 'at', 'by', 'on', 'or', 'an', 'be', 'we', 'he', 'do', 'go', 'no', 'my', 'me', 'us', 'yurekh', 'blueprint', 'approach', 'framework', 'template', 'guide', 'secrets', 'principles', 'strategy', 'strategies'].includes(w.toLowerCase()))
        .slice(0, 5)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      const tags = [...new Set([...topicTags, ...kwList.slice(0, 3)])].slice(0, 6);

      // Generate unique excerpt based on topic
      const topicLower = s.topic.toLowerCase();
      let excerpt = '';
      if (topicLower.includes('how to') || topicLower.includes('guide')) {
        excerpt = `Step-by-step walkthrough on ${s.topic.toLowerCase()}. Learn proven techniques, real-world examples, and expert tips to master this topic.`;
      } else if (topicLower.includes('strategy') || topicLower.includes('strategies')) {
        excerpt = `Discover battle-tested strategies for ${s.topic.toLowerCase()}. Includes case studies, actionable frameworks, and implementation tips.`;
      } else if (topicLower.includes('tips') || topicLower.includes('best practices')) {
        excerpt = `Top expert tips and best practices for ${s.topic.toLowerCase()}. Boost your results with these proven recommendations.`;
      } else if (topicLower.includes('trends') || topicLower.includes('future')) {
        excerpt = `Explore the latest trends shaping ${s.topic.toLowerCase()}. Stay ahead with insights on what's coming next in the industry.`;
      } else if (topicLower.includes('mistakes') || topicLower.includes('avoid')) {
        excerpt = `Common pitfalls to avoid in ${s.topic.toLowerCase()}. Learn from real examples and protect your business from costly errors.`;
      } else {
        excerpt = `Comprehensive insights on ${s.topic.toLowerCase()}. Expert analysis, practical takeaways, and actionable recommendations for professionals.`;
      }

      return {
        id: s.id,
        title: s.topic,
        slug: s.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        content: '',
        excerpt,
        featuredImage: s.previewImage,
        category,
        status: s.status === 'pending' || s.status === 'generating' ? 'scheduled' : s.status,
        author: null,
        publishedAt: null,
        scheduledAt: s.scheduledDate,
        tags,
        views: 0,
        createdAt: s.createdAt || new Date(),
        isSchedule: true,
        company: s.company ? { name: s.company.name, id: s.company.id } : null,
      };
    });

    // Get distinct categories for filtering
    const allPosts = await prisma.blogPost.findMany({
      where: platform ? {} : { companyId: user.companyId },
      select: { category: true },
    });
    const categories = [...new Set(allPosts.map((p: { category: string | null }) => p.category).filter(Boolean))] as string[];

    // Combine posts and scheduled posts
    const allContent = [...posts, ...scheduledPosts];

    return NextResponse.json({ posts: allContent, categories, scheduledCount: scheduledPosts.length });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const body = await req.json();
    const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const post = await prisma.blogPost.create({
      data: { ...body, slug, companyId: user.companyId, author: user.id }
    });
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const body = await req.json();
    if (body.title && !body.slug) {
      body.slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    // Get existing post to check if status is changing to 'published'
    const existingPost = await prisma.blogPost.findUnique({ where: { id } });
    const wasPublished = existingPost?.status === 'published';
    const isNowPublished = body.status === 'published';
    const justPublished = !wasPublished && isNowPublished;

    const post = await prisma.blogPost.update({ where: { id }, data: body });

    // Auto-share to social media when blog is first published
    if (justPublished && post.companyId) {
      // Get company's connected website for social config
      const website = await prisma.connectedWebsite.findFirst({
        where: { companyId: post.companyId, isActive: true },
      });

      if (website && ((website as Record<string, unknown>).autoShareLinkedin || (website as Record<string, unknown>).autoShareTwitter)) {
        const platforms: string[] = [];
        if ((website as Record<string, unknown>).autoShareLinkedin) platforms.push('linkedin');
        if ((website as Record<string, unknown>).autoShareTwitter) platforms.push('twitter');

        // Fire and forget - don't block the response
        autoShareBlog(
          {
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt || '',
            featuredImage: post.featuredImage || undefined,
            tags: (post.tags as string[]) || [],
            publishedAt: post.publishedAt?.toISOString() || new Date().toISOString(),
          },
          {
            linkedinAccessToken: (website as Record<string, unknown>).linkedinAccessToken as string | null,
            linkedinCompanyId: (website as Record<string, unknown>).linkedinCompanyId as string | null,
            twitterApiKey: (website as Record<string, unknown>).twitterApiKey as string | null,
            twitterApiSecret: (website as Record<string, unknown>).twitterApiSecret as string | null,
            twitterAccessToken: (website as Record<string, unknown>).twitterAccessToken as string | null,
            twitterAccessSecret: (website as Record<string, unknown>).twitterAccessSecret as string | null,
          },
          platforms
        ).then(results => {
          console.log('[Social Share] Results:', results);
        }).catch(err => {
          console.error('[Social Share] Error:', err);
        });
      }
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error updating blog post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (post) {
      await prisma.blogPost.delete({ where: { id } });
    } else {
      // Queued (scheduled) blogs are BlogSchedule rows — delete those too
      const schedule = await prisma.blogSchedule.findUnique({ where: { id } });
      if (!schedule) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      await prisma.blogSchedule.delete({ where: { id } });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
