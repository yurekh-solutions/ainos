import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { SEO_SUITES, suiteBySlug } from '@/lib/seo-catalog';
import { pageMetadata, absoluteUrl, metaDescription } from '@/lib/seo';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';

interface Props {
  params: Promise<{ suite: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return SEO_SUITES.map(s => ({ suite: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const suite = suiteBySlug((await params).suite);
  if (!suite) return {};
  return pageMetadata({
    title: `${suite.name.replace(/^AINOS /, '')} Software for Indian Businesses`,
    description: metaDescription(suite.summary, suite.tools.map(t => t.name)),
    path: `/features/${suite.slug}`,
    keywords: suite.keywords,
  });
}

export default async function SuitePage({ params }: Props) {
  const suite = suiteBySlug((await params).suite);
  if (!suite) notFound();

  const others = SEO_SUITES.filter(s => s.slug !== suite.slug);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: suite.name,
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          description: suite.summary,
          url: absoluteUrl(`/features/${suite.slug}`),
          featureList: suite.tools.map(t => t.name),
          publisher: { '@type': 'Organization', name: 'AINOS', url: absoluteUrl('/') },
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: absoluteUrl('/') },
          { name: 'Features', url: absoluteUrl('/features') },
          { name: suite.name, url: absoluteUrl(`/features/${suite.slug}`) },
        ])}
      />

      <section className="bg-gradient-to-b from-purple-50/70 to-white px-4 pb-12 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <nav aria-label="Breadcrumb" className="text-xs text-gray-500">
            <Link href="/" className="hover:text-gray-900">Home</Link>
            <span className="mx-1.5">/</span>
            <Link href="/features" className="hover:text-gray-900">Features</Link>
            <span className="mx-1.5">/</span>
            <span className="text-gray-900">{suite.name.replace(/^AINOS /, '')}</span>
          </nav>
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-5xl text-balance">{suite.name}</h1>
          <p className="mt-3 text-lg font-medium text-[#5b21b6] sm:text-xl">{suite.headline}</p>
          <p className="mt-4 max-w-3xl text-base text-gray-600">{suite.summary}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/auth/register" className="inline-flex items-center gap-2 rounded-full bg-[#5b21b6] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4c1d95]">
              Get started with {suite.name.replace(/^AINOS /, '')} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/auth/signin" className="inline-flex items-center rounded-full border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold">Tools in {suite.name}</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {suite.tools.map(tool => (
            <article key={tool.slug} className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <h3 className="text-lg font-semibold">
                <Link href={`/features/${suite.slug}/${tool.slug}`} className="hover:text-[#4c1d95]">{tool.name}</Link>
              </h3>
              <p className="mt-2 text-sm text-gray-600">{tool.summary}</p>
              <ul className="mt-4 space-y-1.5">
                {tool.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {f}
                  </li>
                ))}
              </ul>
              <Link href={`/features/${suite.slug}/${tool.slug}`} className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-[#5b21b6] hover:text-[#4c1d95]">
                Learn more <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-gray-100 bg-gray-50/60 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl font-bold">More AINOS suites</h2>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {others.map(s => (
              <li key={s.slug}>
                <Link href={`/features/${s.slug}`} className="block rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-medium hover:border-purple-200 hover:text-[#4c1d95]">
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
