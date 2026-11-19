import type { Metadata } from 'next';

/** Canonical origin for every absolute URL the site publishes (sitemap, canonical, OG). */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://ainos-ywu0.onrender.com'
).replace(/\/+$/, '');

export const SITE_NAME = 'AINOS Business Suite';

export const SITE_DESCRIPTION =
  'Unified business platform with GST invoicing, CRM, HR & payroll, inventory, AI-powered marketing and Tally integration. Built for Indian businesses.';

export const absoluteUrl = (path = '/'): string =>
  `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

// Root app/opengraph-image.tsx. Next drops it once a page sets its own openGraph,
// so per-page cards reference it explicitly.
const DEFAULT_OG_IMAGE = { url: '/opengraph-image', width: 1200, height: 630, alt: SITE_NAME };

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
    keywords,
    alternates: { canonical: path },
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
