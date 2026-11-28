import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { SEO_SUITES } from '@/lib/seo-catalog';
import { pageMetadata, absoluteUrl } from '@/lib/seo';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';
import { PageHero } from '@/components/marketing/PageHero';

const TOOL_COUNT = SEO_SUITES.reduce((n, s) => n + s.tools.length, 0);
const ALL_TOOLS = SEO_SUITES.flatMap(suite => suite.tools.map(tool => ({ suite, tool })));

/** The one-sentence answer this page is written to own: what AINOS actually contains. */
const HUB_ANSWER = `AINOS Business Suite contains ${SEO_SUITES.length} suites and ${TOOL_COUNT} tools: GST invoicing and accounting, CRM with leads, deals and follow-ups, inventory and warehouses, manufacturing, HR and payroll, marketing with SEO and AI content, helpdesk, projects and approvals, online stores, point of sale, field operations and AI Studio. Every tool in this list shares one set of customers, products, employees and books, so a record entered once is used everywhere.`;

export const metadata: Metadata = pageMetadata({
  title: 'Features — Finance, CRM, HR, Inventory & AI',
  description: `Explore all ${SEO_SUITES.length} AINOS suites and ${TOOL_COUNT} business tools: GST invoicing, accounting, CRM, HR & payroll, inventory, POS, eCommerce, operations and AI.`,
  path: '/features',
  keywords: ['business software features', 'all-in-one business suite', 'ERP features India'],
});

export default function FeaturesHubPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'AINOS suites',
          itemListElement: SEO_SUITES.map((suite, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: suite.name,
            url: absoluteUrl(`/features/${suite.slug}`),
          })),
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          '@id': absoluteUrl('/features'),
          url: absoluteUrl('/features'),
          name: `AINOS features — ${SEO_SUITES.length} suites and ${TOOL_COUNT} tools`,
          description: HUB_ANSWER,
          inLanguage: ['en-IN', 'en'],
          isPartOf: { '@type': 'WebSite', name: 'AINOS Business Suite', url: absoluteUrl('/') },
          speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', '.answer-block'] },
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          '@id': `${absoluteUrl('/features')}#tools`,
          name: 'AINOS suites and tools',
          numberOfItems: ALL_TOOLS.length,
          itemListElement: ALL_TOOLS.map(({ suite, tool }, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: `${tool.name} (${suite.name})`,
            url: absoluteUrl(`/features/${suite.slug}/${tool.slug}`),
          })),
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: absoluteUrl('/') },
          { name: 'Features', url: absoluteUrl('/features') },
        ])}
      />

      <PageHero
        eyebrow="AINOS Features"
        title="Every tool your business runs on, in one platform"
        description={`${SEO_SUITES.length} suites and ${TOOL_COUNT} tools — from GST invoicing and payroll to inventory, POS and AI — sharing one set of customers, products and books.`}
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Features', href: '/features' },
        ]}
        actions={[
          { label: 'Create your account', href: '/auth/register' },
          { label: 'Sign in', href: '/auth/signin', variant: 'secondary' },
        ]}
      />

      <section className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 sm:pb-14 sm:pt-12 lg:px-8">
        <div className="answer-block mb-8 max-w-4xl rounded-2xl border border-purple-100 bg-[#faf8ff] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b21b6]">What AINOS includes</p>
          <p className="mt-3 text-[15px] leading-relaxed text-gray-800 sm:text-base">{HUB_ANSWER}</p>
        </div>
        <p className="mb-6 max-w-3xl text-sm text-gray-500">
          New to the category?{' '}
          <Link href="/business-suite" className="font-semibold text-[#5b21b6] hover:text-[#4c1d95]">
            Read what a business suite is
          </Link>{' '}
          and how the pieces fit together.
        </p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SEO_SUITES.map(suite => (
            <article key={suite.slug} className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <h2 className="text-lg font-semibold">
                <Link href={`/features/${suite.slug}`} className="hover:text-[#4c1d95]">{suite.name}</Link>
              </h2>
              <p className="mt-2 text-sm text-gray-600">{suite.summary}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {suite.tools.map(tool => (
                  <li key={tool.slug}>
                    <Link
                      href={`/features/${suite.slug}/${tool.slug}`}
                      className="inline-block rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-[#4c1d95] hover:bg-purple-100"
                    >
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href={`/features/${suite.slug}`} className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-[#5b21b6] hover:text-[#4c1d95]">
                Explore {suite.name.replace(/^AINOS /, '')} <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* What sits between the tools: the platform layer, not another product list. */}
      <section className="border-y border-purple-100/70 bg-[#fbfaff] py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5b21b6]">Beyond the tools</p>
              <h2 className="mt-3 text-[25px] font-semibold leading-[1.24] tracking-tight text-gray-950 sm:text-[30px]">
                One platform, not a stack of subscriptions
              </h2>
              <p className="mt-4 text-base leading-relaxed text-gray-600">
                Features are easy to list. The difference is what happens between them: one customer record, one product
                record, one set of books, and automation that runs without anyone retyping a number.
              </p>
              <Link
                href="/business-suite"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#5b21b6] transition-colors hover:text-[#4c1d95]"
              >
                See how the suite fits together <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:col-span-7">
              {[
                ['Set up in the order you need', 'Start with invoicing alone and switch modules on as the team grows. Nothing is locked to a bundle you did not choose.'],
                ['Automation that runs itself', 'Payment reminders, recurring invoices and GST summaries are generated from the records you already have.'],
                ['One view across the business', 'Receivables, stock, pipeline and staff hours sit on the same dashboard instead of four logins.'],
                ['Workflows that stay joined', 'Invoice, delivery challan, e-invoice fields and Tally export all read the same document.'],
                ['Operations next to finance', 'Payroll, counter billing, manufacturing and support tickets post into the same books.'],
              ].map(([title, body]) => (
                <div key={title} className="border-l-2 border-purple-200 pl-4">
                  <dt className="text-sm font-semibold text-gray-950">{title}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-gray-600">{body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </>
  );
}
