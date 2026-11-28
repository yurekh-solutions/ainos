/**
 * Public navigation and company facts shared by the marketing header, footer,
 * sitemap and structured data. Keeping one list means a new page cannot ship as
 * an orphan that crawlers and visitors cannot reach.
 */

export type NavLink = { label: string; href: string; note?: string };
export type NavColumn = { title: string; links: readonly NavLink[] };
export type NavEntry =
  | { kind: 'menu'; label: string; columns: readonly NavColumn[] }
  | { kind: 'link'; label: string; href: string };

/**
 * The header menu. Every public page in FOOTER_GROUPS appears here too, grouped
 * the same way, so no page is reachable from the footer only.
 */
export const SITE_NAV: readonly NavEntry[] = [
  {
    kind: 'menu',
    label: 'Product',
    columns: [
      {
        title: 'The suite',
        links: [
          { label: 'Business suite', href: '/business-suite', note: 'Every module on one login' },
          { label: 'All features', href: '/features', note: 'The full tool list' },
          { label: 'Solutions', href: '/solutions' },
          { label: 'Industries', href: '/industries' },
          { label: 'Coverage', href: '/coverage' },
        ],
      },
      {
        title: 'Platform',
        links: [
          { label: 'Integrations', href: '/integrations' },
          { label: 'Security', href: '/security' },
          { label: 'Pricing', href: '/pricing' },
        ],
      },
    ],
  },
  {
    kind: 'menu',
    label: 'Resources',
    columns: [
      {
        title: 'Learn',
        links: [
          { label: 'Blog', href: '/blog' },
          { label: 'Glossary', href: '/glossary' },
          { label: 'FAQ', href: '/faq' },
        ],
      },
      {
        title: 'Get started',
        links: [
          { label: 'Book a walkthrough', href: '/demo' },
          { label: 'Site map', href: '/site-map' },
        ],
      },
      {
        title: 'Legal',
        links: [
          { label: 'Privacy', href: '/privacy' },
          { label: 'Terms', href: '/terms' },
        ],
      },
    ],
  },
  {
    kind: 'menu',
    label: 'Company',
    columns: [
      {
        title: 'AINOS',
        links: [
          { label: 'About', href: '/about' },
          { label: 'Careers', href: '/careers' },
          { label: 'Partners', href: '/partners' },
        ],
      },
      {
        title: 'Talk to us',
        links: [
          { label: 'Contact', href: '/contact' },
          { label: 'Yurekh', href: 'https://yurekh.com/' },
        ],
      },
    ],
  },
  { kind: 'link', label: 'Pricing', href: '/pricing' },
];

export const FOOTER_GROUPS = [
  {
    title: 'Product',
    links: [
      { label: 'Business suite', href: '/business-suite' },
      { label: 'All features', href: '/features' },
      { label: 'Solutions', href: '/solutions' },
      { label: 'Industries', href: '/industries' },
      { label: 'Coverage', href: '/coverage' },
      { label: 'Integrations', href: '/integrations' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Security', href: '/security' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Partners', href: '/partners' },
      { label: 'Contact', href: '/contact' },
      { label: 'Blog', href: '/blog' },
      { label: 'Yurekh', href: 'https://yurekh.com/' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'FAQ', href: '/faq' },
      { label: 'Glossary', href: '/glossary' },
      { label: 'Book a walkthrough', href: '/demo' },
      { label: 'Site map', href: '/site-map' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
] as const;

/** Static public pages that belong in the XML sitemap. */
export const MARKETING_ROUTES = [
  { path: '/business-suite', priority: 0.95, changeFrequency: 'weekly' as const },
  { path: '/about', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/solutions', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/industries', priority: 0.9, changeFrequency: 'monthly' as const },
  { path: '/industries/retail-and-ecommerce', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/industries/wholesale-distribution', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/industries/manufacturing', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/industries/agencies-and-professional-services', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/industries/startups-and-new-businesses', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/industries/logistics-and-field-operations', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/coverage', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/integrations', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/pricing', priority: 0.9, changeFrequency: 'weekly' as const },
  { path: '/demo', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/faq', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/careers', priority: 0.5, changeFrequency: 'monthly' as const },
  { path: '/partners', priority: 0.6, changeFrequency: 'monthly' as const },
  { path: '/security', priority: 0.6, changeFrequency: 'yearly' as const },
  { path: '/contact', priority: 0.6, changeFrequency: 'yearly' as const },
  { path: '/glossary', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/site-map', priority: 0.4, changeFrequency: 'monthly' as const },
];

export const COMPANY = {
  name: 'AINOS Business Suite',
  legalName: 'Yurekh Solutions Private Limited',
  location: 'Mumbai, Maharashtra, India',
  email: 'info.ainosio@gmail.com',
  website: 'https://ainossuite.com',
  tagline: 'One login. Every business workspace.',
} as const;
