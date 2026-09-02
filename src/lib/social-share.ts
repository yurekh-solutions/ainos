// Social Auto-Sharing Service
// Auto-post blogs to LinkedIn, Twitter when published

interface SharePost {
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  tags: string[];
  publishedAt: string;
}

interface ShareConfig {
  linkedinAccessToken?: string | null;
  linkedinCompanyId?: string | null;
  twitterApiKey?: string | null;
  twitterApiSecret?: string | null;
  twitterAccessToken?: string | null;
  twitterAccessSecret?: string | null;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// LinkedIn Share
export async function shareToLinkedIn(
  post: SharePost,
  config: ShareConfig
): Promise<{ success: boolean; error?: string; postId?: string }> {
  if (!config.linkedinAccessToken) {
    return { success: false, error: 'LinkedIn access token not configured' };
  }

  const blogUrl = `${BASE_URL}/blog/${post.slug}`;
  const hashtags = post.tags.slice(0, 3).map(t => `#${t.replace(/\s+/g, '')}`).join(' ');
  
  const text = `📝 ${post.title}\n\n${post.excerpt}\n\n🔗 Read more: ${blogUrl}\n\n${hashtags} #Blog #AI`;

  try {
    // LinkedIn API v2 - Share on personal profile or company page
    const endpoint = config.linkedinCompanyId
      ? `https://api.linkedin.com/v2/ugcPosts`
      : `https://api.linkedin.com/v2/ugcPosts`;

    const body = {
      author: config.linkedinCompanyId
        ? `urn:li:organization:${config.linkedinCompanyId}`
        : `urn:li:person:(me)`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text,
          },
          shareMediaCategory: 'ARTICLE',
          media: [
            {
              status: 'READY',
              originalUrl: blogUrl,
              title: { text: post.title },
              description: { text: post.excerpt },
              thumbnails: post.featuredImage
                ? [{ url: post.featuredImage }]
                : [],
            },
          ],
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.linkedinAccessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `LinkedIn API error ${res.status}: ${errText.slice(0, 200)}` };
    }

    const data = await res.json();
    return { success: true, postId: data.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { success: false, error: message };
  }
}

// Twitter/X Share
export async function shareToTwitter(
  post: SharePost,
  config: ShareConfig
): Promise<{ success: boolean; error?: string; tweetId?: string }> {
  if (!config.twitterApiKey || !config.twitterAccessToken) {
    return { success: false, error: 'Twitter API credentials not configured' };
  }

  const blogUrl = `${BASE_URL}/blog/${post.slug}`;
  const hashtags = post.tags.slice(0, 3).map(t => `#${t.replace(/\s+/g, '')}`).join(' ');
  
  // Twitter has 280 char limit - truncate excerpt if needed
  const maxExcerptLen = 280 - (post.title.length + blogUrl.length + hashtags.length + 20);
  const truncatedExcerpt = post.excerpt.length > maxExcerptLen
    ? post.excerpt.slice(0, maxExcerptLen - 3) + '...'
    : post.excerpt;

  const tweetText = `${post.title}\n\n${truncatedExcerpt}\n\n🔗 ${blogUrl}\n\n${hashtags}`;

  try {
    // Twitter API v2 - Create tweet
    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.twitterAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: tweetText }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `Twitter API error ${res.status}: ${errText.slice(0, 200)}` };
    }

    const data = await res.json();
    return { success: true, tweetId: data.data?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { success: false, error: message };
  }
}

// Master share function - shares to all configured platforms
export async function autoShareBlog(
  post: SharePost,
  config: ShareConfig,
  platforms: string[]
): Promise<Record<string, { success: boolean; error?: string; postId?: string }>> {
  const results: Record<string, { success: boolean; error?: string; postId?: string }> = {};

  for (const platform of platforms) {
    switch (platform) {
      case 'linkedin':
        results.linkedin = await shareToLinkedIn(post, config);
        break;
      case 'twitter':
        results.twitter = await shareToTwitter(post, config);
        break;
      default:
        results[platform] = { success: false, error: `Unknown platform: ${platform}` };
    }
  }

  return results;
}

export type { SharePost, ShareConfig };
