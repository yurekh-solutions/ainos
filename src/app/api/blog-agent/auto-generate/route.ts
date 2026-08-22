import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scrapePage } from '@/lib/website-scraper';
import { publishBlog } from '@/lib/blog-publisher';

// POST /api/blog-agent/auto-generate
// Called daily by cron - generates pending blogs scheduled for today
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret (optional security)
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader !== `Bearer ${process.env.CRON_SECRET || 'ainos-cron-2024'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find all pending schedules for today
    const pendingSchedules = await prisma.blogSchedule.findMany({
      where: {
        status: 'pending',
        scheduledDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        subscription: {
          include: {
            connectedWebsite: true,
          },
        },
      },
    });

    const results = [];

    for (const schedule of pendingSchedules) {
      try {
        // Mark as generating
        await prisma.blogSchedule.update({
          where: { id: schedule.id },
          data: { status: 'generating' },
        });

        const website = schedule.subscription?.connectedWebsite;
        if (!website) {
          await prisma.blogSchedule.update({
            where: { id: schedule.id },
            data: { status: 'failed' },
          });
          results.push({ id: schedule.id, status: 'failed', reason: 'No connected website' });
          continue;
        }

        // Build website context for AI
        let websiteContext = '';
        if (website.description) {
          websiteContext += `Website: ${website.name || website.url}\nDescription: ${website.description}\n`;
        }
        if (website.niche) {
          websiteContext += `Niche: ${website.niche}\n`;
        }
        if (website.brandVoice) {
          websiteContext += `Brand Voice: ${website.brandVoice}\n`;
        }
        if (website.topics) {
          const topics = website.topics as string[];
          websiteContext += `Available Topics: ${topics.slice(0, 10).join(', ')}\n`;
        }

        // Scrape 1-2 pages for fresh context
        let freshContext = '';
        try {
          const pageData = await scrapePage(website.url);
          if (pageData) {
            freshContext = `Current page headings: ${pageData.headings.slice(0, 5).join(', ')}\n`;
            freshContext += `Page content excerpt: ${pageData.rawText.substring(0, 1000)}\n`;
          }
        } catch { /* skip if scrape fails */ }

        // Generate blog content via Pollinations
        const systemPrompt = `You are an expert SEO content writer. Write a comprehensive, SEO-optimized blog post of approximately ${schedule.targetWordCount} words.

Rules:
- Write in ${schedule.tone} tone
- Use the website's brand voice and style
- Include proper H2 and H3 headings
- Write in markdown format
- Include an engaging introduction and strong conclusion with CTA
- Include FAQ section (5 questions) for AEO/AI citation
- Use EEAT signals throughout
- Include internal linking suggestions
- Optimize for Google search ranking AND AI citation (ChatGPT, Perplexity, Gemini)
- Make it actionable and valuable

Respond in this exact JSON format (no other text):
{
  "title": "SEO-optimized compelling title",
  "slug": "url-friendly-slug",
  "excerpt": "150-160 char meta description",
  "content": "Full blog post in markdown",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "category": "Relevant category",
  "seoScore": 85,
  "seoTips": ["Tip 1", "Tip 2"]
}`;

        const userPrompt = `Write a ${schedule.targetWordCount}-word SEO and AEO optimized blog post about: "${schedule.topic}"

Website Context:
${websiteContext}

Fresh Website Data:
${freshContext}

${schedule.keywords ? `Primary keywords: ${schedule.keywords}` : ''}

Requirements:
- Target word count: ${schedule.targetWordCount} words
- Optimize for Google search ranking (SEO)
- Optimize for AI citation (AEO)
- Include 5 FAQ questions
- Use EEAT signals
- Strong CTA at the end`;

        const aiRes = await fetch('https://text.pollinations.ai/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'openai',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
        });

        let blogData;
        if (aiRes.ok) {
          const text = await aiRes.text();
          try {
            blogData = JSON.parse(text);
          } catch {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              blogData = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('Could not parse AI response');
            }
          }
        } else {
          throw new Error('AI generation failed');
        }

        // Generate featured image
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
          `Professional blog header image about ${schedule.topic}, modern business concept, clean design, high quality, 16:9`
        )}?width=1200&height=630&nologo=true&seed=${Date.now()}`;

        // Create BlogPost
        const blogPost = await prisma.blogPost.create({
          data: {
            title: blogData.title || schedule.topic,
            slug: blogData.slug || schedule.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            content: blogData.content || '',
            excerpt: blogData.excerpt || '',
            featuredImage: imageUrl,
            category: blogData.category || website.niche || 'General',
            status: 'published',
            publishedAt: new Date(),
            tags: blogData.tags || [],
            companyId: schedule.companyId,
          },
        });

        // Update schedule
        await prisma.blogSchedule.update({
          where: { id: schedule.id },
          data: {
            status: 'published',
            blogPostId: blogPost.id,
          },
        });

        // Publish to external targets (webhook, WordPress, email)
        const publishTargets = (schedule.publishTargets as string[]) || ['ainos'];
        const externalTargets = publishTargets.filter(t => t !== 'ainos');
        if (externalTargets.length > 0) {
          const publishResults = await publishBlog(
            {
              title: blogData.title || schedule.topic,
              slug: blogData.slug || '',
              content: blogData.content || '',
              excerpt: blogData.excerpt || '',
              tags: blogData.tags || [],
              category: blogData.category || '',
              featuredImage: imageUrl,
              publishedAt: new Date().toISOString(),
            },
            {
              publishMethod: website.publishMethod,
              webhookUrl: website.webhookUrl,
              webhookSecret: website.webhookSecret,
              wordpressUrl: website.wordpressUrl,
              wordpressUsername: website.wordpressUsername,
              wordpressAppPassword: website.wordpressAppPassword,
              deliveryEmail: website.deliveryEmail,
            },
            externalTargets
          );
          await prisma.blogSchedule.update({
            where: { id: schedule.id },
            data: { webhookResponse: publishResults as unknown as import('@prisma/client').Prisma.JsonValue },
          });
        }

        // Update subscription quota
        if (schedule.subscriptionId) {
          await prisma.blogSubscription.update({
            where: { id: schedule.subscriptionId },
            data: {
              blogsUsed: { increment: 1 },
              blogsRemaining: { decrement: 1 },
            },
          });
        }

        results.push({ id: schedule.id, status: 'published', blogPostId: blogPost.id });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        await prisma.blogSchedule.update({
          where: { id: schedule.id },
          data: { status: 'failed' },
        });
        results.push({ id: schedule.id, status: 'failed', reason: message });
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
      published: results.filter(r => r.status === 'published').length,
      failed: results.filter(r => r.status === 'failed').length,
    });
  } catch (error) {
    console.error('Auto-generate error:', error);
    return NextResponse.json({ error: 'Auto-generate failed' }, { status: 500 });
  }
}
