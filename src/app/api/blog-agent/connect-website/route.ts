import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureCompany } from '@/lib/prisma-helpers';
import { connectAndAnalyzeWebsite } from '@/lib/website-scraper';

// POST /api/blog-agent/connect-website
// Connect a website, scrape it, analyze with AI, create subscription + initial schedules
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const company = await ensureCompany(session.user.email, session.user.name || 'User');
    if (!company) {
      return NextResponse.json({ error: 'Failed to setup company' }, { status: 500 });
    }

    const {
      url,
      publishMethod = 'ainos',
      webhookUrl,
      webhookSecret,
      wordpressUrl,
      wordpressUsername,
      wordpressAppPassword,
      deliveryEmail,
    } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'Website URL is required' }, { status: 400 });
    }

    // Check if already connected
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    const existing = await prisma.connectedWebsite.findUnique({
      where: { url: normalizedUrl },
    });
    if (existing) {
      return NextResponse.json({ error: 'This website is already connected' }, { status: 409 });
    }

    // Scrape and analyze the website
    let analysis;
    try {
      const result = await connectAndAnalyzeWebsite(normalizedUrl);
      analysis = result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to analyze website';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { scrapedData, analysis: aiAnalysis } = analysis;

    // Create ConnectedWebsite
    const website = await prisma.connectedWebsite.create({
      data: {
        url: normalizedUrl,
        name: scrapedData.name,
        description: scrapedData.description,
        techStack: scrapedData.techStack,
        niche: aiAnalysis.niche,
        topics: aiAnalysis.topics,
        brandVoice: aiAnalysis.brandVoice,
        competitors: aiAnalysis.competitors,
        pageLinks: scrapedData.pageLinks,
        publishMethod,
        webhookUrl: webhookUrl || null,
        webhookSecret: webhookSecret || null,
        wordpressUrl: wordpressUrl || null,
        wordpressUsername: wordpressUsername || null,
        wordpressAppPassword: wordpressAppPassword || null,
        deliveryEmail: deliveryEmail || null,
        companyId: company.id,
      },
    });

    // Auto-create BlogSubscription (30 blogs/month)
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const subscription = await prisma.blogSubscription.create({
      data: {
        plan: 'standard',
        blogsPerMonth: 30,
        blogsUsed: 0,
        blogsRemaining: 30,
        startDate: now,
        currentPeriodEnd: periodEnd,
        autoSchedule: true,
        schedulePattern: 'daily',
        connectedWebsiteId: website.id,
        companyId: company.id,
      },
    });

    // Generate all 30 blog schedules for the month
    const topics = aiAnalysis.topics.slice(0, 30);
    const schedules = [];
    for (let i = 0; i < topics.length; i++) {
      const scheduledDate = new Date(now);
      scheduledDate.setDate(scheduledDate.getDate() + i);
      scheduledDate.setHours(9, 0, 0, 0);

      // Generate diverse SEO keywords from topic
      const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'how', 'what', 'which', 'their', 'this', 'that', 'with', 'from', 'have', 'been', 'will', 'each', 'make', 'like', 'long', 'look', 'many', 'some', 'them', 'then', 'than', 'into', 'more', 'also', 'just', 'over', 'such', 'take', 'year', 'very', 'when', 'come', 'could', 'other', 'after', 'most', 'about', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'of', 'in', 'to', 'is', 'it', 'as', 'at', 'by', 'on', 'or', 'an', 'be', 'we', 'he', 'do', 'go', 'no', 'my', 'me', 'us']);
      const topicWords = topics[i]
        .split(/\s+/)
        .map(w => w.replace(/[^a-zA-Z0-9]/g, ''))
        .filter(w => w.length > 3 && !stopWords.has(w.toLowerCase()))
        .slice(0, 6);
      const keywords = [aiAnalysis.niche, ...topicWords].filter(Boolean).join(', ');

      const schedule = await prisma.blogSchedule.create({
        data: {
          topic: topics[i],
          keywords,
          tone: 'Professional',
          targetWordCount: 3000,
          scheduledDate,
          status: 'pending',
          publishTargets: publishMethod === 'ainos' ? ['ainos'] : ['ainos', publishMethod],
          subscriptionId: subscription.id,
          connectedWebsiteId: website.id,
          companyId: company.id,
        },
      });
      schedules.push(schedule);
    }

    return NextResponse.json({
      website: {
        id: website.id,
        url: website.url,
        name: website.name,
        techStack: website.techStack,
        niche: website.niche,
      },
      subscription: {
        id: subscription.id,
        blogsPerMonth: subscription.blogsPerMonth,
        blogsRemaining: subscription.blogsRemaining,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
      initialSchedules: schedules.length,
      topics: aiAnalysis.topics,
      brandVoice: aiAnalysis.brandVoice,
      competitors: aiAnalysis.competitors,
    });
  } catch (error) {
    console.error('Connect website error:', error);
    return NextResponse.json({ error: 'Failed to connect website' }, { status: 500 });
  }
}
