// The public AINOS blog (/blog, its sitemap and RSS) only lists AINOS's own articles.
// Posts written for customer websites are delivered to those customers and published on
// their own sites; their /blog/[slug] pages stay reachable for previews and shares but are noindex.
export const AINOS_BLOG_AUTHOR = 'AINOS Editorial Team';

export const ainosBlogWhere = { author: AINOS_BLOG_AUTHOR } as const;

export function isAinosPost(post: { author?: string | null }): boolean {
  return post.author === AINOS_BLOG_AUTHOR;
}

// Long article headlines get a shorter search title so Google does not cut them off.
const SEO_TITLES: Record<string, string> = {
  'best-gst-billing-software-india-small-business-2026': 'Best GST Billing Software for Small Business (2026)',
  'digital-marketing-strategies-small-business-2026': 'Digital Marketing for Small Business: 9 Strategies',
  'how-to-rank-on-google-2026-seo-aeo-guide': 'How to Rank on Google in 2026: SEO + AEO Guide',
  'ai-automation-for-small-business-2026-guide': 'AI Automation for Small Business: 2026 Guide',
};

export function seoTitleFor(slug: string, title: string): string {
  return SEO_TITLES[slug] || title;
}
