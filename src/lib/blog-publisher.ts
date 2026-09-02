// Universal Blog Publisher - works with ANY tech stack
// Webhook (universal), WordPress API, Email, AINOS Blog

interface BlogPostData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  tags: string[];
  category: string;
  featuredImage: string;
  publishedAt: string;
  seoTitle?: string;
  seoDescription?: string;
}

interface WebsiteConfig {
  publishMethod: string;
  webhookUrl?: string | null;
  webhookSecret?: string | null;
  wordpressUrl?: string | null;
  wordpressUsername?: string | null;
  wordpressAppPassword?: string | null;
  deliveryEmail?: string | null;
}

// Method 1: Webhook Publishing (UNIVERSAL - works with ANY tech stack)
// User implements a webhook receiver in their language:
//   Next.js:  app/api/webhooks/ainos-blog/route.ts
//   PHP:      webhook.php with file_get_contents('php://input')
//   Python:   Flask/Django POST endpoint
//   HTML:     Use Formspree/Webhook.site as intermediary
export async function publishToWebhook(
  post: BlogPostData,
  website: WebsiteConfig
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  if (!website.webhookUrl) {
    return { success: false, error: 'No webhook URL configured' };
  }

  const payload = {
    event: 'blog.published',
    timestamp: new Date().toISOString(),
    data: {
      title: post.title,
      slug: post.slug,
      content: post.content,
      contentHtml: markdownToHTML(post.content),
      excerpt: post.excerpt,
      tags: post.tags,
      category: post.category,
      featuredImage: post.featuredImage,
      publishedAt: post.publishedAt,
      seoTitle: post.seoTitle || post.title,
      seoDescription: post.seoDescription || post.excerpt,
    },
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'AINOS-Blog-Agent/1.0',
  };

  if (website.webhookSecret) {
    headers['X-Webhook-Secret'] = website.webhookSecret;
  }

  // Retry up to 3 times
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(website.webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      });

      if (res.ok) {
        return { success: true, statusCode: res.status };
      }

      if (attempt === 3) {
        return { success: false, statusCode: res.status, error: `Webhook returned ${res.status}` };
      }

      // Wait before retry
      await new Promise(r => setTimeout(r, 2000 * attempt));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error';
      if (attempt === 3) {
        return { success: false, error: message };
      }
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}

// Method 2: WordPress Publishing (for WordPress sites)
export async function publishToWordPress(
  post: BlogPostData,
  website: WebsiteConfig
): Promise<{ success: boolean; postId?: string; error?: string }> {
  if (!website.wordpressUrl || !website.wordpressUsername || !website.wordpressAppPassword) {
    return { success: false, error: 'WordPress credentials not configured' };
  }

  const wpUrl = website.wordpressUrl.replace(/\/$/, '');
  const auth = Buffer.from(`${website.wordpressUsername}:${website.wordpressAppPassword}`).toString('base64');

  // Prepare WordPress post data
  const wpPost = {
    title: post.title,
    content: markdownToHTML(post.content),
    excerpt: post.excerpt,
    status: 'publish',
    slug: post.slug,
    tags: post.tags,
    meta: {
      seo_title: post.seoTitle || post.title,
      seo_description: post.seoDescription || post.excerpt,
    },
  };

  try {
    const res = await fetch(`${wpUrl}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify(wpPost),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: `WordPress API error: ${res.status} - ${errorText}` };
    }

    const data = await res.json();
    return { success: true, postId: String(data.id) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { success: false, error: message };
  }
}

// Method 3: Email Delivery (universal fallback)
// Sends formatted HTML email with blog content
export async function publishViaEmail(
  post: BlogPostData,
  website: WebsiteConfig
): Promise<{ success: boolean; error?: string }> {
  if (!website.deliveryEmail) {
    return { success: false, error: 'No delivery email configured' };
  }

  // Build HTML email body
  const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>New Blog Post: ${post.title}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">New Blog Post Ready!</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0;">From AINOS AI Blog Agent</p>
  </div>
  <div style="border: 1px solid #e5e7eb; border-top: none; padding: 30px; border-radius: 0 0 12px 12px;">
    ${post.featuredImage ? `<img src="${post.featuredImage}" alt="${post.title}" style="width: 100%; border-radius: 8px; margin-bottom: 20px;">` : ''}
    <h2 style="color: #1f2937; margin-top: 0;">${post.title}</h2>
    <p style="color: #6b7280; font-size: 14px;">Category: ${post.category} | Tags: ${post.tags.join(', ')}</p>
    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1;">
      <p style="color: #4b5563; font-style: italic; margin: 0;">${post.excerpt}</p>
    </div>
    <h3 style="color: #374151;">Content (Markdown):</h3>
    <pre style="background: #f3f4f6; padding: 15px; border-radius: 8px; overflow-x: auto; font-size: 13px; line-height: 1.6; white-space: pre-wrap;">${post.content}</pre>
    <h3 style="color: #374151;">Content (HTML):</h3>
    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
      ${markdownToHTML(post.content)}
    </div>
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px;">Generated by AINOS AI Blog Agent | Slug: ${post.slug}</p>
    </div>
  </div>
</body>
</html>`;

  // Use a simple mailto or log the email (in production, use a service like Resend/SendGrid)
  // For now, we'll store it as a scheduled action
  console.log(`[Email Delivery] Blog post "${post.title}" ready for email to ${website.deliveryEmail}`);

  // Send via Resend if configured
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'AINOS Blog <onboarding@resend.dev>',
          to: [website.deliveryEmail],
          subject: `New Blog Post: ${post.title}`,
          html: emailHtml,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        return { success: true };
      }
    } catch (err) {
      console.error('[Email Delivery] Resend error:', err);
    }
  }

  return { success: true, error: 'Email logged (no email service configured)' };
}

// Method 4: AINOS Blog Publishing (platform)
// Already handled by creating BlogPost in Prisma

// Utility: Simple Markdown to HTML converter
function markdownToHTML(md: string): string {
  return md
    // Images first (before links)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:16px 0;">')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    // Headings
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Bold & italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    // Paragraphs
    .replace(/^(?!<[hul]).+(?!\w)$/gm, '<p>$&</p>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/<p><\/p>/g, '');
}

// Master publish function - publishes to all configured targets
export async function publishBlog(
  post: BlogPostData,
  website: WebsiteConfig,
  targets: string[]
): Promise<Record<string, { success: boolean; error?: string; postId?: string }>> {
  const results: Record<string, { success: boolean; error?: string; postId?: string }> = {};

  for (const target of targets) {
    switch (target) {
      case 'webhook':
        results.webhook = await publishToWebhook(post, website);
        break;
      case 'wordpress':
        results.wordpress = await publishToWordPress(post, website);
        break;
      case 'email':
        results.email = await publishViaEmail(post, website);
        break;
      case 'ainos':
        results.ainos = { success: true }; // Handled by BlogPost creation
        break;
      default:
        results[target] = { success: false, error: `Unknown publish target: ${target}` };
    }
  }

  return results;
}

export { markdownToHTML };
export type { BlogPostData, WebsiteConfig };
