import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowUpRight } from 'lucide-react';
import { SEO_SUITES } from '@/lib/seo-catalog';
import { INDUSTRIES } from '@/lib/industries';
import { pageMetadata, absoluteUrl } from '@/lib/seo';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';
import { CtaBand, PageHero, SectionHeading } from '@/components/marketing/PageHero';

const TOOL_COUNT = SEO_SUITES.reduce((total, suite) => total + suite.tools.length, 0);

export const metadata: Metadata = pageMetadata({
  title: 'Site Map — Every AINOS Business Suite Page',
  description: `Every public page on ainossuite.com in one list: ${SEO_SUITES.length} suites, ${TOOL_COUNT} tools, ${INDUSTRIES.length} industries, pricing, integrations, glossary and company pages.`,
  path: '/site-map',
  keywords: ['AINOS site map', 'ainossuite pages', 'business suite page index'],
});

const MAIN_PAGES = [
  { label: 'Home', href: '/', note: 'The product in one page' },
  { label: 'AINOS Business Suite', href: '/business-suite', note: 'What a business suite is and what is inside this one' },
  { label: 'Features', href: '/features', note: 'Every suite and tool' },
  { label: 'Solutions', href: '/solutions', note: 'Which modules each business type starts with' },
  { label: 'Industries', href: '/industries', note: 'Retail, wholesale, manufacturing, agencies, startups, field operations' },
  { label: 'Coverage', href: '/coverage', note: 'GST, payroll, logistics and compliance scope' },
  { label: 'Pricing', href: '/pricing', note: 'AINOS One, individual apps and AI Studio' },
  { label: 'Integrations', href: '/integrations', note: 'Tally, payments, GST lookup and email' },
  { label: 'Security', href: '/security', note: 'Access control, hosting and data handling' },
  { label: 'Book a walkthrough', href: '/demo', note: 'A guided tour of the workspace' },
  { label: 'FAQ', href: '/faq', note: 'Direct answers by topic' },
  { label: 'Glossary', href: '/glossary', note: 'GST, accounting and software definitions' },
  { label: 'Blog', href: '/blog', note: 'Guides on GST, CRM and business software' },
  { label: 'About', href: '/about', note: 'The company behind AINOS' },
  { label: 'Partners', href: '/partners', note: 'CA firms, agencies and implementation partners' },
  { label: 'Careers', href: '/careers', note: 'Open roles at Yurekh Solutions' },
  { label: 'Contact', href: '/contact', note: 'Sales, support and company details' },
];

const ACCOUNT_PAGES = [
  { label: 'Create account', href: '/auth/register' },
  { label: 'Sign in', href: '/auth/signin' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms and Conditions', href: '/terms' },
];

export default function SiteMapPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          '@id': absoluteUrl('/site-map'),
          url: absoluteUrl('/site-map'),
          name: 'AINOS Business Suite site map',
          description: 'Every public page, suite and tool on ainossuite.com.',
          inLanguage: 'en-IN',
          isPartOf: { '@id': `${absoluteUrl('/')}#website` },
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: SEO_SUITES.length,
            itemListElement: SEO_SUITES.map((suite, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: suite.name,
              url: absoluteUrl(`/features/${suite.slug}`),
            })),
          },
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: absoluteUrl('/') },
          { name: 'Site map', url: absoluteUrl('/site-map') },
        ])}
      />

      <PageHero
        eyebrow="Site map"
        title="Every page on ainossuite.com, in one list."
        description={`${SEO_SUITES.length} suites, ${TOOL_COUNT} tools, ${INDUSTRIES.length} industry pages and every company page — linked directly, so nothing on the site is more than one click away.`}
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Site map', href: '/site-map' },
        ]}
        actions={[
          { label: 'Browse all features', href: '/features' },
          { label: 'See pricing', href: '/pricing', variant: 'secondary' },
        ]}
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <SectionHeading eyebrow="Main pages" title="Start anywhere." description="The pages most visitors look for." />
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MAIN_PAGES.map((page) => (
            <li key={page.href}>
              <Link
                href={page.href}
                className="group flex h-full items-start justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-colors hover:border-purple-200"
              >
                <span>
                  <span className="block text-sm font-semibold text-gray-950 group-hover:text-[#4c1d95]">{page.label}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-gray-500">{page.note}</span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-[#5b21b6]" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-purple-100/70 bg-[#fbfaff] py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Suites and tools"
            title={`${SEO_SUITES.length} suites, ${TOOL_COUNT} tools.`}
            description="Each suite has its own page, and every tool inside it has one too."
          />
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {SEO_SUITES.map((suite) => (
              <div key={suite.slug} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                <Link
                  href={`/features/${suite.slug}`}
                  className="text-base font-semibold text-gray-950 transition-colors hover:text-[#4c1d95]"
                >
                  {suite.name}
                </Link>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                  {suite.tools.length} tools · {suite.headline}
                </p>
                <ul className="mt-4 space-y-1.5">
                  {suite.tools.map((tool) => (
                    <li key={tool.slug}>
                      <Link
                        href={`/features/${suite.slug}/${tool.slug}`}
                        className="text-sm text-gray-600 transition-colors hover:text-[#5b21b6]"
                      >
                        {tool.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <SectionHeading
              eyebrow="Industries"
              title="Business types."
              description="Each page covers the friction points, the modules used first and the order of rollout."
            />
            <ul className="mt-8 space-y-2">
              {INDUSTRIES.map((industry) => (
                <li key={industry.slug}>
                  <Link
                    href={`/industries/${industry.slug}`}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-medium text-gray-800 transition-colors hover:border-purple-200 hover:text-[#4c1d95]"
                  >
                    {industry.name}
                    <ArrowUpRight className="h-3.5 w-3.5 text-gray-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeading
              eyebrow="Account and legal"
              title="Company pages."
              description="Everything else that is public on the site."
            />
            <ul className="mt-8 space-y-2">
              {ACCOUNT_PAGES.map((page) => (
                <li key={page.href}>
                  <Link
                    href={page.href}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-medium text-gray-800 transition-colors hover:border-purple-200 hover:text-[#4c1d95]"
                  >
                    {page.label}
                    <ArrowUpRight className="h-3.5 w-3.5 text-gray-300" />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs leading-relaxed text-gray-500">
              Crawlers can use the XML sitemap at{' '}
              <a href="/sitemap.xml" className="font-semibold text-[#5b21b6] hover:text-[#4c1d95]">
                /sitemap.xml
              </a>{' '}
              and the machine-readable summary for AI answer engines at{' '}
              <a href="/llms.txt" className="font-semibold text-[#5b21b6] hover:text-[#4c1d95]">
                /llms.txt
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="AINOS Business Suite"
        title="The shortest path is the trial."
        description="Create a company, add your GST details and open the workflows you already pay for elsewhere. Fourteen days, no card conversation needed."
        actions={[
          { label: 'Start 14-day trial', href: '/auth/register' },
          { label: 'Talk to the team', href: '/contact', variant: 'secondary' },
        ]}
      />
    </>
  );
}
