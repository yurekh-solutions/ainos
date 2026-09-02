import { prisma } from '@/lib/prisma';
import { scrapePage } from '@/lib/website-scraper';
import { publishBlog } from '@/lib/blog-publisher';
import { generateAIText } from '@/lib/ai-provider';
import { getBlogImage, replaceContentImages } from '@/lib/blog-images';

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
    const systemPrompt = `You are a senior SEO content strategist and expert writer with 15+ years of experience. You write premium, publication-quality long-form blog posts that rank on Google page 1 AND get cited by ChatGPT/Perplexity/Google AI Overviews.

ABSOLUTE QUALITY RULES (MUST follow — articles failing these are rejected):
- MINIMUM ${schedule.targetWordCount} words in the "content" field. Going under is a failure.
- EXACTLY 8 to 12 H2 sections (## Heading) in the content. NOT 0, NOT 4 — at least 8.
- Each H2 section MUST be 350-500 words. NO H2 under 250 words.
- Each H2 section should have 2-3 H3 subsections (### Heading).
- Include AT LEAST 3 inline images using markdown: ![descriptive alt text](https://images.pexels.com/photos/...). Use real Pexels-style image URLs (e.g. https://images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg). Place images after the H2 heading they relate to.
- Include AT LEAST 5 tags in the "tags" array. NO empty tags.
- Include a strong CTA in the conclusion. NEVER skip the CTA.
- Include a "Table of Contents" section right after the intro listing all H2 headings.
- Include a "Frequently Asked Questions" section with 5 questions and detailed answers.
- Use ONLY markdown (## for H2, ### for H3, ![](url) for images, **bold**, - for bullets, 1. for numbered lists).

WRITING VOICE:
- Conversational yet authoritative. Sound like a human expert, NOT a generic AI.
- Every claim needs a number, a stat, a brand name, a location, or a real example.
- Reference the company's actual services, products, and target market where relevant.
- Use "Pro Tip:" or "Industry Insight:" callouts in at least 3 sections.
- Write for the reader who needs to make a buying decision — not for search engines.

SEO & AEO STRUCTURE:
- Title (50-60 chars), keyword-rich, compelling.
- Excerpt: 150-160 chars meta description with a hook.
- 8-12 H2 sections covering the topic comprehensively.
- FAQ answers must be self-contained and citable (each starts with a clear answer sentence).
- Tags: 5-7 keywords mixing primary, secondary, long-tail, and intent terms.

JSON FORMAT (no other text, no markdown code fences):
{
  "title": "...",
  "slug": "url-friendly-slug",
  "excerpt": "...",
  "content": "Full markdown with 8-12 H2 sections, 350-500 words each, 3+ inline images, table of contents, FAQ, CTA",
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
- Include 2-3 specific case studies or real-world scenarios
- Every H2 section must have genuine depth (400+ words each)
- NO fluff, NO repetitive content, NO generic advice that applies to any business
- Write for humans first, search engines second
- The reader should finish feeling they got genuine expert value`;

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

    // Featured image: prefer a fresh real photo (Pexels/Unsplash) when a
    // provider key is configured; otherwise keep the preview picked at
    // scheduling time so card and article stay consistent
    const imageUrl = (process.env.PEXELS_API_KEY || process.env.UNSPLASH_ACCESS_KEY)
      ? await getBlogImage(schedule.topic, website.niche || undefined)
      : (schedule.previewImage || await getBlogImage(schedule.topic, website.niche || undefined));

    // Replace ALL AI-generated images in content with topic-relevant images
    // AI often inserts random Pexels URLs unrelated to the blog topic
    let finalContent = blogData.content || '';
    if (finalContent) {
      finalContent = await replaceContentImages(finalContent, schedule.topic, website.niche || undefined);
    }

    // Create BlogPost
    const blogPost = await prisma.blogPost.create({
      data: {
        title: blogData.title || schedule.topic,
        slug: blogData.slug || schedule.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        content: finalContent,
        excerpt: blogData.excerpt || '',
        featuredImage: imageUrl,
        category: blogData.category || website.niche || 'General',
        status: 'published',
        publishedAt: new Date(),
        tags: blogData.tags || [],
        companyId: schedule.companyId,
      },
    });

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
            title: 'New Blog Published!',
            message: `"${blogPost.title}" has been published and is live on your website.`,
            type: 'blog_published',
            read: false,
          },
        });
      }

      // Send email notification to all company users (if Resend is configured)
      if (process.env.RESEND_API_KEY) {
        try {
          const emailRecipients = companyUsers.map(u => u.email).filter(Boolean);
          if (emailRecipients.length > 0) {
            const emailHtml = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #7c3aed;">🎉 New Blog Published!</h2>
                <p><strong>"${blogPost.title}"</strong> has been published and is now live.</p>
                <p style="color: #666;">Category: ${blogPost.category}</p>
                <a href="/blog/${blogPost.slug}" style="display: inline-block; background: #7c3aed; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 16px;">Read Blog</a>
                <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
                <p style="color: #999; font-size: 12px;">You're receiving this because you're registered on AINOS.</p>
              </div>
            `;
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'AINOS Blog <onboarding@resend.dev>',
                to: emailRecipients,
                subject: `New Blog Published: ${blogPost.title}`,
                html: emailHtml,
              }),
              signal: AbortSignal.timeout(10000),
            });
          }
        } catch (emailErr) {
          console.error('[Email Notification] Failed to send:', emailErr);
        }
      }
    }

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
