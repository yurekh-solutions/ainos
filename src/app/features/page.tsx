import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { SEO_SUITES } from '@/lib/seo-catalog';
import { pageMetadata, absoluteUrl } from '@/lib/seo';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';

const TOOL_COUNT = SEO_SUITES.reduce((n, s) => n + s.tools.length, 0);

export const metadata: Metadata = pageMetadata({
  title: 'Features — Finance, CRM, HR, Inventory & AI Tools',
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
        data={breadcrumbJsonLd([
          { name: 'Home', url: absoluteUrl('/') },
          { name: 'Features', url: absoluteUrl('/features') },
        ])}
      />

      <section className="bg-gradient-to-b from-purple-50/70 to-white px-4 pb-12 pt-16 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#5b21b6]">AINOS Features</p>
        <h1 className="mx-auto mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl text-balance">
          Every tool your business runs on, in one platform
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600 sm:text-lg">
          {SEO_SUITES.length} suites and {TOOL_COUNT} tools — from GST invoicing and payroll to inventory, POS and AI —
          sharing one set of customers, products and books.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/auth/register" className="inline-flex items-center gap-2 rounded-full bg-[#5b21b6] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4c1d95]">
            Create your account <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/auth/signin" className="inline-flex items-center rounded-full border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50">
            Sign in
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SEO_SUITES.map(suite => (
            <article key={suite.slug} className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <h2 className="text-lg font-bold">
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
    </>
  );
}
