import { prisma } from '@/lib/prisma';
import { scrapePage } from '@/lib/website-scraper';
import { publishBlog } from '@/lib/blog-publisher';
import { generateAIText } from '@/lib/ai-provider';
import { getVerifiedBlogImage } from '@/lib/blog-images';
import { tidyBlogContent, blogQualityIssue, blogExcerpt, cleanBlogTags } from '@/lib/blog-quality';
import { sendEmail } from '@/lib/email';

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 90);

// Platform-wide generation throttle. The per-company `runningCompanies` guard
// stops one tenant storming itself, but 100 tenants each running their own
// background loop would fire 100 concurrent AI + image calls on ONE shared key
// and instantly trip rate limits (mass 429 → everything stalls). This semaphore
// caps how many articles generate at the same time ACROSS all companies on the
// instance. Raise it (or move to a dedicated worker) when the AI quota grows.
// Applied only inside startBackgroundGeneration's bulk loop so user-initiated
// single "Generate Now" calls and the serial daily cron never queue behind it.
class Semaphore {
  private available: number;
  private readonly waiters: Array<() => void> = [];
  constructor(permits: number) { this.available = permits; }
  acquire(): Promise<void> {
    if (this.available > 0) { this.available--; return Promise.resolve(); }
    return new Promise<void>(resolve => this.waiters.push(resolve));
  }
  release(): void {
    const next = this.waiters.shift();
    if (next) next();
    else this.available++;
  }
}
const GENERATION_CONCURRENCY = Number(process.env.BLOG_GEN_CONCURRENCY) || 2;
const aiGate = new Semaphore(GENERATION_CONCURRENCY);

// Generates ONE scheduled blog immediately: AI writes SEO/AEO content,
// a verified featured image is attached (Pexels -> Unsplash -> Pollinations),
// the BlogPost is created and schedule + quota are updated.
// The post goes live on client sites on its scheduled date (publishedAt is
// the go-live time). Writing ahead never changes that date.
// Shared by the daily cron (auto-generate) and the on-demand "Generate Now" endpoint.
export async function generateScheduleNow(scheduleId: string, opts?: { force?: boolean }): Promise<{ status: string; blogPostId?: string; reason?: string; already?: boolean; liveAt?: string }> {
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
  if (schedule.blogPostId) {
    return { status: 'published', blogPostId: schedule.blogPostId, already: true };
  }
  if (!['pending', 'failed'].includes(schedule.status)) {
    return { status: schedule.status, reason: 'Schedule is not ready for generation' };
  }
  // Respect the publishing calendar. A future-dated schedule waits until its time;
  // only an explicit on-demand action or the daily cron (force) writes ahead of it.
  const targets = Array.isArray(schedule.publishTargets) ? schedule.publishTargets : ['ainos'];
  const future = schedule.scheduledDate > new Date();
  if (future && !opts?.force) {
    return { status: 'pending', reason: 'Not yet due — scheduled for a later date' };
  }
  if (future && opts?.force && targets.some(t => t !== 'ainos')) {
    return { status: 'pending', reason: 'External publishing waits until the scheduled time' };
  }

  try {
    // Atomic claim: cron and dashboard requests must not write the same article.
    const claimed = await prisma.blogSchedule.updateMany({
      where: { id: schedule.id, status: { in: ['pending', 'failed'] }, blogPostId: null },
      data: { status: 'generating' },
    });
    if (!claimed.count) return { status: 'generating', reason: 'This article is already being written' };

    const website = schedule.subscription?.connectedWebsite;
    if (!website) {
      await prisma.blogSchedule.update({
        where: { id: schedule.id },
        data: { status: 'failed' },
      });
      return { status: 'failed', reason: 'No connected website' };
    }

    // Sites without the embed code get a 2 hour setup window before writing
    // starts. After that blogs are still written (they show in the dashboard
    // and go live as soon as the code is added) but the connection status is
    // never faked — only a real widget sighting or page check marks it connected.
    const siteLive = website.connectionStatus === 'connected';
    if (!website.isActive) {
      await prisma.blogSchedule.update({ where: { id: schedule.id }, data: { status: 'cancelled' } });
      return { status: 'cancelled', reason: 'Website or subscription is inactive' };
    }
    // Generate regardless of whether the embed is detected yet. Blogs appear in
    // the dashboard immediately and go live on the client site the moment the
    // embed code is added. Connection status stays honest via site-health (a real
    // widget sighting / page check) — gating generation here only made brand-new
    // users see "no blogs" for the first two hours, which looked like a failure.

    // Topic relevance check disabled — user-requested blogs should generate regardless
    // The niche is used for context below, but we don't reject topics anymore

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
    const systemPrompt = `You are a senior SEO content strategist and expert writer with 15+ years of experience. You write premium, publication-quality long-form blog posts that rank on Google page 1 AND get cited by ChatGPT/Perplexity/Google AI Overviews.

ABSOLUTE QUALITY RULES (MUST follow — articles failing these are rejected):
- MINIMUM ${schedule.targetWordCount} words in the "content" field. Going under is a failure.
- EXACTLY 8 to 12 H2 sections (## Heading) in the content. NOT 0, NOT 4 — at least 8.
- Each H2 section MUST be 350-500 words. NO H2 under 250 words.
- Each H2 section should have 2-3 H3 subsections (### Heading).
- CRITICAL: Do NOT include any image URLs or ![markdown images] in the content. Images are handled separately by the publishing system.
- Include AT LEAST 5 tags in the "tags" array. NO empty tags.
- Include a strong CTA in the conclusion. NEVER skip the CTA.
- Include a "Table of Contents" section right after the intro listing all H2 headings.
- Include a "Frequently Asked Questions" section with 5 questions and detailed answers.
- Use ONLY markdown (## for H2, ### for H3, **bold**, - for bullets, 1. for numbered lists). NO image syntax.

WRITING VOICE:
- Conversational yet authoritative. Sound like a human expert, NOT a generic AI.
- Use concrete, useful examples. Never invent statistics, citations, testimonials, prices, or company case studies. Only state business facts supported by the supplied website context; label hypothetical scenarios clearly.
- Reference the company's actual services, products, and target market where relevant.
- Use "Pro Tip:" or "Industry Insight:" callouts in at least 3 sections.
- Write for the reader who needs to make a buying decision — not for search engines.

SEO & AEO STRUCTURE:
- Title (50-60 chars), keyword-rich, compelling.
- Excerpt: 150-160 chars meta description with a hook.
- Start with a DIRECT ANSWER paragraph (40-60 words answering the main query — for AI citation).
- 8-12 H2 sections covering the topic comprehensively.
- FAQ answers must be self-contained and citable (each starts with a clear answer sentence).
- Tags: 5-7 keywords mixing primary, secondary, long-tail, and intent terms.

JSON FORMAT (no other text, no markdown code fences):
{
  "title": "...",
  "slug": "url-friendly-slug",
  "excerpt": "...",
  "content": "Full markdown with 8-12 H2 sections, 350-500 words each, table of contents, FAQ, CTA. NO image URLs.",
  "tags": ["tag1","tag2","tag3","tag4","tag5"],
  "category": "Most relevant category",
  "seoScore": 92,
  "seoTips": ["tip 1","tip 2","tip 3"]
}`;

    const userPrompt = `Write a premium, ${schedule.targetWordCount}+ word SEO and AEO optimized blog post about:

"${schedule.topic}"

WEBSITE CONTEXT:
${websiteContext}

FRESH WEBSITE DATA (from live scrape):
${freshContext}

${schedule.keywords ? `PRIMARY KEYWORDS: ${schedule.keywords}` : ''}

WRITING INSTRUCTIONS:
- Tone: ${schedule.tone}
- Target audience: visitors to this specific website
- The blog must feel like it was written BY this company FOR their customers
- Reference the company's actual services, products, and location where relevant
- Include 2-3 practical scenarios; label them hypothetical unless the website context verifies them
- Every H2 section must have genuine depth (400+ words each)
- NO fluff, NO repetitive content, NO generic advice that applies to any business
- Write for humans first, search engines second
- The reader should finish feeling they got genuine expert value
- NO image URLs or ![image] syntax in content — images are added automatically`;

    const aiRaw = await generateAIText(systemPrompt, userPrompt, { json: true, timeoutMs: 180_000 });

    let blogData;
    // Strip markdown code fences and any leading explanation text before parsing
    const cleanRaw = aiRaw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    try {
      blogData = JSON.parse(cleanRaw);
    } catch {
      // Try a more careful extraction: find first { and last balanced }
      const firstBrace = cleanRaw.indexOf('{');
      if (firstBrace !== -1) {
        // Find matching closing brace by counting depth
        let depth = 0;
        let end = -1;
        let inStr = false;
        let esc = false;
        for (let i = firstBrace; i < cleanRaw.length; i++) {
          const c = cleanRaw[i];
          if (esc) { esc = false; continue; }
          if (c === '\\') { esc = true; continue; }
          if (c === '"') { inStr = !inStr; continue; }
          if (inStr) continue;
          if (c === '{') depth++;
          else if (c === '}') { depth--; if (depth === 0) { end = i; break; } }
        }
        if (end !== -1) {
          const candidate = cleanRaw.slice(firstBrace, end + 1);
          try { blogData = JSON.parse(candidate); } catch { blogData = null; }
        }
      }
      if (!blogData && aiRaw.length > 800) {
        // Salvage: try to extract the markdown content field by regex
        const contentMatch = cleanRaw.match(/"content"\s*:\s*"([\s\S]*?)(?<!\\)"\s*[,}]/);
        const titleMatch = cleanRaw.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        const tagsMatch = cleanRaw.match(/"tags"\s*:\s*\[([\s\S]*?)\]/);
        const excerptMatch = cleanRaw.match(/"excerpt"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        const slugMatch = cleanRaw.match(/"slug"\s*:\s*"((?:[^"\\]|\\.)*)"/);

        if (contentMatch) {
          // Unescape the captured markdown
          const rawContent = contentMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\')
            .replace(/\\t/g, '\t');
          blogData = {
            title: titleMatch ? titleMatch[1] : schedule.topic,
            slug: slugMatch ? slugMatch[1] : schedule.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            excerpt: excerptMatch ? excerptMatch[1].slice(0, 160) : rawContent.replace(/[#*`]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160),
            content: rawContent,
            tags: tagsMatch ? tagsMatch[1].match(/"((?:[^"\\]|\\.)*)"/g)?.map(s => s.replace(/^"|"$/g, '').replace(/\\"/g, '"')) || [] : [],
            category: website.niche || 'General',
          };
        } else {
          // Last resort: AI returned raw markdown — publish it
          blogData = {
            title: schedule.topic,
            slug: schedule.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            excerpt: aiRaw.replace(/[#*`]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160),
            content: cleanRaw,
            tags: [],
            category: website.niche || 'General',
          };
        }
      }
      if (!blogData) throw new Error('Could not parse AI response');
    }

    // CONTENT QUALITY VALIDATION
    // 1. If content starts with {, it's a JSON wrapper — extract real content
    let rawContent = blogData.content || '';
    if (rawContent.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(rawContent.trim());
        if (parsed.content && typeof parsed.content === 'string') {
          rawContent = parsed.content;
        } else if (parsed.title) {
          rawContent = `# ${parsed.title}\n\n${parsed.excerpt || ''}\n\n${parsed.content || ''}`;
        }
      } catch {
        // Not valid JSON — strip JSON-like prefix lines
        const lines = rawContent.split('\n');
        let startIdx = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith('# ') || lines[i].trim().startsWith('## ')) { startIdx = i; break; }
          if (lines[i].includes('"') && (lines[i].includes('title') || lines[i].includes('slug'))) { startIdx = i + 1; }
        }
        rawContent = lines.slice(startIdx).join('\n').trim();
      }
      blogData.content = rawContent;
    }

    // 2. Check minimum content quality. Thin articles are retried (failed rows
    // go back to pending up to MAX_RETRIES) instead of being published.
    rawContent = tidyBlogContent(rawContent);
    blogData.content = rawContent;
    const qualityIssue = blogQualityIssue(rawContent);
    if (qualityIssue) {
      console.warn(`[Content Rejection] "${schedule.topic}": ${qualityIssue}`);
      await prisma.blogSchedule.update({ where: { id: schedule.id }, data: { status: 'failed', retryCount: (schedule.retryCount || 0) + 1 } });
      return { status: 'failed', reason: qualityIssue };
    }

    // Featured image: always a fresh topic-relevant image, checked to actually
    // load before it is attached (Pexels -> Unsplash -> Pollinations)
    const imageUrl = await getVerifiedBlogImage(blogData.title || schedule.topic, website.niche || undefined);

    const finalContent = rawContent;

    // Create BlogPost — handle slug conflicts by appending unique suffix
    let slug = slugify(blogData.slug || blogData.title || schedule.topic) || slugify(schedule.topic);
    const existingSlug = await prisma.blogPost.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const now = new Date();
    const goLive = schedule.scheduledDate > now ? schedule.scheduledDate : now;
    const liveLater = goLive > now;
    const tags = cleanBlogTags(blogData.tags);
    const excerpt = (typeof blogData.excerpt === 'string' && blogData.excerpt.trim().length >= 40)
      ? blogData.excerpt.trim().slice(0, 200)
      : blogExcerpt(finalContent);

    // Article, schedule link, and quota commit together. A notification or
    // delivery failure must not create another article or charge quota twice.
    const blogPost = await prisma.$transaction(async tx => {
      const post = await tx.blogPost.create({
      data: {
        title: blogData.title || schedule.topic,
        slug,
        content: finalContent,
        excerpt,
        featuredImage: imageUrl,
        category: blogData.category || website.niche || 'General',
        status: 'published',
        publishedAt: goLive,
        scheduledAt: schedule.scheduledDate,
        tags,
        companyId: schedule.companyId,
      },
      });
      const linked = await tx.blogSchedule.updateMany({
        where: { id: schedule.id, status: 'generating', blogPostId: null },
        data: { status: 'published', blogPostId: post.id },
      });
      if (!linked.count) throw new Error('Schedule was cancelled while writing');
      if (schedule.subscriptionId) {
        await tx.blogSubscription.update({
          where: { id: schedule.subscriptionId },
          data: { blogsUsed: { increment: 1 }, blogsRemaining: { decrement: 1 } },
        });
      }
      return post;
    }, { timeout: 15_000 });
    const liveDate = goLive.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const notice = liveLater
      ? { title: 'Blog ready', text: `"${blogPost.title}" is written and scheduled for ${liveDate}.${siteLive ? '' : ' Add the embed code so visitors can see it on your website.'}` }
      : siteLive
        ? { title: 'New Blog Published!', text: `"${blogPost.title}" is published and available through your website integration.` }
        : { title: 'New Blog Published!', text: `"${blogPost.title}" is published. Add the AINOS embed code to your website so visitors can see it.` };

    // Create notification for all users in the company
    if (!schedule.companyId) {
      console.warn('[Notifications] Skipping - no companyId on schedule');
    } else {
      const companyUsers = await prisma.user.findMany({
        where: { companyId: schedule.companyId },
        select: { id: true, email: true, name: true },
      });
      for (const user of companyUsers) {
        if (!user.id) continue;
        await prisma.notification.create({
          data: {
            userId: user.id,
            company: { connect: { id: schedule.companyId } },
            title: notice.title,
            message: notice.text,
            type: liveLater ? 'blog_ready' : 'blog_published',
            read: false,
          },
        });
      }

      // Send email notification to all company users via the shared sendEmail util
      try {
        const emailRecipients = companyUsers.map(u => u.email).filter(Boolean) as string[];
        if (emailRecipients.length > 0) {
          const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #7c3aed;">${notice.title}</h2>
              <p>${notice.text.replace(/</g, '&lt;')}</p>
              <p style="color: #666;">Category: ${blogPost.category}</p>
              <a href="/blog/${blogPost.slug}" style="display: inline-block; background: #7c3aed; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 16px;">Read Blog</a>
              <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
              <p style="color: #999; font-size: 12px;">You're receiving this because you're registered on AINOS.</p>
            </div>
          `;
          for (const to of emailRecipients) {
            await sendEmail({ to, subject: `${notice.title}: ${blogPost.title}`, html: emailHtml });
          }
        }
      } catch (emailErr) {
        console.error('[Email Notification] Failed to send:', emailErr);
      }
    }

    // Publish to external targets (webhook, WordPress, email)
    const publishTargets = (schedule.publishTargets as string[]) || ['ainos'];
    const externalTargets = publishTargets.filter(t => t !== 'ainos');
    if (externalTargets.length > 0) {
      const publishResults = await publishBlog(
        {
          title: blogData.title || schedule.topic,
          slug: blogPost.slug,
          content: finalContent,
          excerpt,
          tags,
          category: blogData.category || '',
          featuredImage: imageUrl,
          publishedAt: goLive.toISOString(),
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

    return { status: 'published', blogPostId: blogPost.id, liveAt: goLive.toISOString() };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[blog-gen] schedule ${scheduleId}:`, message);
    const persisted = await prisma.blogSchedule.findUnique({ where: { id: schedule.id }, select: { blogPostId: true } });
    if (persisted?.blogPostId) {
      return { status: 'published', blogPostId: persisted.blogPostId, reason: 'Article saved; a notification or external delivery failed' };
    }
    // Quota/rate-limit errors (Gemini 429, Pollinations 402) are temporary —
    // keep the row pending ("Preparing") so it retries on the next run or
    // daily quota reset instead of showing a scary FAILED card.
    // Quota/rate-limit AND transient infra errors (DB slot exhaustion, network
    // timeouts) are temporary — keep the row pending so it retries on the next
    // run instead of being abandoned as FAILED after 5 tries.
    const retryable = /429|403|402|quota|payment required|busy right now|featured image unavailable|connection|slots|too many|timeout|timed out|econn|eai_again|socket hang up|network|prisma/i.test(message);
    const currentRetry = schedule.retryCount || 0;
    await prisma.blogSchedule.updateMany({
      where: { id: schedule.id, status: 'generating' },
      data: {
        status: retryable ? 'pending' : 'failed',
        retryCount: currentRetry + 1,
      },
    });
    return { status: retryable ? 'pending' : 'failed', reason: message };
  }
}

// Module-level guard: one background batch per company at a time.
// On serverless (Render/Vercel) this Set resets on cold start — that's fine
// because the DB-based 'generating' recovery below handles interrupted runs.
const runningCompanies = new Set<string>();

// Maximum retry attempts before a failed schedule is silently archived
const MAX_RETRIES = 5;

// Kicks off server-side background generation of every pending scheduled blog
// for a company. Returns immediately; the server keeps writing blogs one by one
// (full article + premium image) and they appear as published. Safe to call
// right after connecting a website or from the "Generate All" button.
export function startBackgroundGeneration(companyId: string): boolean {
  if (runningCompanies.has(companyId)) {
    console.log(`[Blog Gen] Already running for company ${companyId}`);
    return false;
  }
  console.log(`[Blog Gen] Starting background generation for company ${companyId}`);
  runningCompanies.add(companyId);
  (async () => {
    const attempted = new Set<string>();
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    try {
      // recover rows stuck in 'generating' from an interrupted previous run
      // (safe: the runningCompanies guard ensures a single loop per company)
      await prisma.blogSchedule.updateMany({
        where: { companyId, status: 'generating', updatedAt: { lt: new Date(Date.now() - 60 * 60 * 1000) } },
        data: { status: 'pending' },
      });
      // silently reset failed rows with retryCount < MAX_RETRIES so they
      // get another chance without showing errors in the UI
      await prisma.blogSchedule.updateMany({
        where: { companyId, status: 'failed', retryCount: { lt: MAX_RETRIES } },
        data: { status: 'pending' },
      });
      for (;;) {
        // pending first (date order), skip schedules that exhausted retries
        const next = await prisma.blogSchedule.findFirst({
          where: { companyId, status: 'pending', retryCount: { lt: MAX_RETRIES }, id: { notIn: [...attempted] } },
          orderBy: { scheduledDate: 'asc' },
        });
        if (!next) break;
        console.log(`[Blog Gen] Processing: ${next.topic.substring(0, 50)}... (status: ${next.status})`);
        attempted.add(next.id);
        // Global cap: only ~2 articles generate at once across ALL tenants, so a
        // 100-user burst sharing one AI key + DB never trips rate limits together.
        await aiGate.acquire();
        let result;
        try {
          result = await generateScheduleNow(next.id);
        } finally {
          aiGate.release();
        }
        console.log(`[Blog Gen] Result: ${result.status} - ${result.reason || 'ok'}`);
        // quota exhausted on every provider — stop burning attempts; the
        // remaining rows stay pending and retry on the next run/reset
        if (result.status === 'pending') break;
        // gentle pacing so AI rate limits never trip
        await sleep(result.status === 'failed' ? 6000 : 2500);
      }
      // Archive old schedules (not delete blogs) to keep the queue clean
      archiveOldSchedules(companyId);
    } catch { /* stop silently; cron will catch up later */ }
    finally {
      runningCompanies.delete(companyId);
    }
  })();
  return true;
}

// Archive published schedules older than 7 days — keeps the active queue
// clean WITHOUT deleting the actual BlogPost records (companies keep their content).
async function archiveOldSchedules(companyId: string) {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await prisma.blogSchedule.updateMany({
      where: {
        companyId,
        status: 'published',
        blogPostId: { not: null },
        updatedAt: { lt: sevenDaysAgo },
        blogPost: { publishedAt: { lt: sevenDaysAgo } },
      },
      data: { status: 'archived' },
    });

    if (result.count > 0) {
      console.log(`[Blog Archive] Archived ${result.count} old schedules for company ${companyId} (blogs preserved)`);
    }
  } catch (err) {
    console.error('[Blog Archive] Error:', err);
  }
}
