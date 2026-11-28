import type { Metadata } from 'next';

/**
 * Canonical origin for every absolute URL the site publishes (sitemap, canonical, OG).
 * Always the production domain — never the per-environment app URL — so the
 * Render subdomain and localhost both point search engines at ainossuite.com.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://ainossuite.com').replace(/\/+$/, '');

export const SITE_NAME = 'AINOS Business Suite';

/** Short brand string used inside page titles and social cards. */
export const SITE_SHORT_NAME = 'AINOS';

export const SITE_DESCRIPTION =
  'AINOS Business Suite is an all-in-one business suite: GST invoicing, accounting, CRM, HR and payroll, inventory, POS, marketing and AI in one login.';

/**
 * Terms every public page competes for. AINOS is an Indian brand selling
 * globally, so each page repeats the category phrase ("business suite") next to
 * the brand name — that pairing is what teaches search engines and AI answer
 * engines which company answers the query.
 */
export const BRAND_KEYWORDS = [
  'AINOS',
  'AINOS Business Suite',
  'ainossuite',
  'business suite',
  'all-in-one business suite',
  'business management software India',
];

/** Page keywords first, then the shared brand set, without duplicates. */
export function withBrandKeywords(keywords: string[] = []): string[] {
  return Array.from(new Set([...keywords, ...BRAND_KEYWORDS]));
}

export const absoluteUrl = (path = '/'): string =>
  `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

// Root app/opengraph-image.tsx. Next drops it once a page sets its own openGraph,
// so per-page cards reference it explicitly.
const DEFAULT_OG_IMAGE = { url: '/opengraph-image', width: 1200, height: 630, alt: SITE_NAME };

/**
 * Builds a meta description in Google's ~155-character snippet window: starts from
 * `base` and appends `extras` (joined as a list) only while they still fit.
 */
export function metaDescription(base: string, extras: string[] = [], max = 155): string {
  let out = base.trim();
  const picked: string[] = [];
  for (const extra of extras) {
    const next = `${out} Includes ${[...picked, extra].join(', ')}.`;
    if (next.length > max) break;
    picked.push(extra);
  }
  if (picked.length) out = `${out} Includes ${picked.join(', ')}.`;
  return out.length > max ? `${out.slice(0, out.lastIndexOf(' ', max - 1))}…` : out;
}

/**
 * Per-page metadata with a self-referencing canonical and matching Open Graph /
 * Twitter cards. `title` is the page-specific part; the root layout's template
 * appends the brand.
 */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  noindex?: boolean;
}): Metadata {
  const { title, description, path, keywords, noindex } = opts;
  return {
    title,
    description,
    keywords: withBrandKeywords(keywords),
    // One canonical URL, plus hreflang entries so the single English edition
    // serves India and every other market instead of competing with itself.
    alternates: {
      canonical: path,
      languages: { 'en-IN': path, en: path, 'x-default': path },
    },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_IN',
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: { card: 'summary_large_image', title, description, images: [DEFAULT_OG_IMAGE.url] },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
