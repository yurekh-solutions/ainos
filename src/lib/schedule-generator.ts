import { prisma } from '@/lib/prisma';
import { scrapePage } from '@/lib/website-scraper';
import { publishBlog } from '@/lib/blog-publisher';
import { generateAIText } from '@/lib/ai-provider';
import { getBlogImage } from '@/lib/blog-images';

// Generates ONE scheduled blog immediately: AI writes SEO/AEO content,
// a premium featured image is attached (Pexels -> Unsplash -> Pollinations),
// the published BlogPost is created and schedule + quota are updated.
// Shared by the daily cron (auto-generate) and the on-demand "Generate Now" endpoint.
export async function generateScheduleNow(scheduleId: string): Promise<{ status: string; blogPostId?: string; reason?: string; already?: boolean }> {
  const schedule = await prisma.blogSchedule.findUnique({
    where: { id: scheduleId },
    include: {
      subscription: {
        include: {
          connectedWebsite: true,
        },
      },
    },
  });

  if (!schedule) return { status: 'failed', reason: 'Schedule not found' };
  if (schedule.status === 'published' && schedule.blogPostId) {
    return { status: 'published', blogPostId: schedule.blogPostId, already: true };
  }

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
      return { status: 'failed', reason: 'No connected website' };
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

    // Generate blog content via unified AI provider (Gemini first, Pollinations fallback)
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

    const aiRaw = await generateAIText(systemPrompt, userPrompt, { json: true, timeoutMs: 180_000 });

    let blogData;
    try {
      blogData = JSON.parse(aiRaw);
    } catch {
      const jsonMatch = aiRaw.replace(/```(?:json)?/gi, '').match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { blogData = JSON.parse(jsonMatch[0]); } catch { blogData = null; }
      }
      if (!blogData && aiRaw.length > 800) {
        // Salvage: AI replied with raw markdown instead of JSON — publish it
        // as the article instead of failing the schedule
        blogData = {
          title: schedule.topic,
          slug: schedule.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          excerpt: aiRaw.replace(/[#*`]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160),
          content: aiRaw.replace(/```(?:json)?/gi, ''),
          tags: [],
          category: website.niche || 'General',
        };
      }
      if (!blogData) throw new Error('Could not parse AI response');
    }

    // Featured image: prefer a fresh real photo (Pexels/Unsplash) when a
    // provider key is configured; otherwise keep the preview picked at
    // scheduling time so card and article stay consistent
    const imageUrl = (process.env.PEXELS_API_KEY || process.env.UNSPLASH_ACCESS_KEY)
      ? await getBlogImage(schedule.topic, website.niche || undefined)
      : (schedule.previewImage || await getBlogImage(schedule.topic, website.niche || undefined));

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
        data: { webhookResponse: publishResults ? (publishResults as import('@prisma/client').Prisma.InputJsonValue) : undefined },
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

    return { status: 'published', blogPostId: blogPost.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[blog-gen] schedule ${scheduleId} not published:`, message);
    // Quota/rate-limit errors (Gemini 429, Pollinations 402) are temporary —
    // keep the row pending ("Preparing") so it retries on the next run or
    // daily quota reset instead of showing a scary FAILED card.
    const quota = /429|403|402|quota|payment required|busy right now/i.test(message);
    await prisma.blogSchedule.update({
      where: { id: schedule.id },
      data: { status: quota ? 'pending' : 'failed' },
    });
    return { status: quota ? 'pending' : 'failed', reason: message };
  }
}

// Module-level guard: one background batch per company at a time
const runningCompanies = new Set<string>();

// Kicks off server-side background generation of every pending scheduled blog
// for a company. Returns immediately; the server keeps writing blogs one by one
// (full article + premium image) and they appear as published. Safe to call
// right after connecting a website or from the "Generate All" button.
export function startBackgroundGeneration(companyId: string): boolean {
  if (runningCompanies.has(companyId)) return false;
  runningCompanies.add(companyId);
  (async () => {
    const attempted = new Set<string>();
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    try {
      // recover rows stuck in 'generating' from an interrupted previous run
      // (safe: the runningCompanies guard ensures a single loop per company)
      await prisma.blogSchedule.updateMany({
        where: { companyId, status: 'generating' },
        data: { status: 'pending' },
      });
      for (;;) {
        // pending first (date order), then retry failed rows once per run
        let next = await prisma.blogSchedule.findFirst({
          where: { companyId, status: 'pending' },
          orderBy: { scheduledDate: 'asc' },
        });
        if (!next) {
          next = await prisma.blogSchedule.findFirst({
            where: { companyId, status: 'failed', id: { notIn: [...attempted] } },
            orderBy: { scheduledDate: 'asc' },
          });
        }
        if (!next) break;
        attempted.add(next.id);
        const result = await generateScheduleNow(next.id);
        // quota exhausted on every provider — stop burning attempts; the
        // remaining rows stay pending and retry on the next run/reset
        if (result.status === 'pending') break;
        // gentle pacing so AI rate limits never trip
        await sleep(result.status === 'failed' ? 6000 : 2500);
      }
    } catch { /* stop silently; cron will catch up later */ }
    finally { runningCompanies.delete(companyId); }
  })();
  return true;
}
