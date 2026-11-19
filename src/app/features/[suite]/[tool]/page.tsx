import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { SEO_SUITES, toolBySlugs } from '@/lib/seo-catalog';
import { pageMetadata, absoluteUrl } from '@/lib/seo';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';

interface Props {
  params: Promise<{ suite: string; tool: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return SEO_SUITES.flatMap(s => s.tools.map(t => ({ suite: s.slug, tool: t.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { suite: suiteSlug, tool: toolSlug } = await params;
  const found = toolBySlugs(suiteSlug, toolSlug);
  if (!found) return {};
  const { suite, tool } = found;
  return pageMetadata({
    title: `${tool.name} — ${suite.name.replace(/^AINOS /, '')} Software`,
    description: tool.summary,
    path: `/features/${suite.slug}/${tool.slug}`,
    keywords: [...tool.keywords, ...suite.keywords.slice(0, 2)],
  });
}

export default async function ToolPage({ params }: Props) {
  const { suite: suiteSlug, tool: toolSlug } = await params;
  const found = toolBySlugs(suiteSlug, toolSlug);
  if (!found) notFound();
  const { suite, tool } = found;

  const url = absoluteUrl(`/features/${suite.slug}/${tool.slug}`);
  const siblings = suite.tools.filter(t => t.slug !== tool.slug);
  const suiteShort = suite.name.replace(/^AINOS /, '');

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: `AINOS ${tool.name}`,
          applicationCategory: 'BusinessApplication',
          applicationSubCategory: suite.name,
          operatingSystem: 'Web',
          description: tool.summary,
          url,
          featureList: tool.features,
          keywords: tool.keywords.join(', '),
          publisher: { '@type': 'Organization', name: 'AINOS', url: absoluteUrl('/') },
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: absoluteUrl('/') },
          { name: 'Features', url: absoluteUrl('/features') },
          { name: suite.name, url: absoluteUrl(`/features/${suite.slug}`) },
          { name: tool.name, url },
        ])}
      />

      <section className="bg-gradient-to-b from-purple-50/70 to-white px-4 pb-12 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <nav aria-label="Breadcrumb" className="text-xs text-gray-500">
            <Link href="/" className="hover:text-gray-900">Home</Link>
            <span className="mx-1.5">/</span>
            <Link href="/features" className="hover:text-gray-900">Features</Link>
            <span className="mx-1.5">/</span>
            <Link href={`/features/${suite.slug}`} className="hover:text-gray-900">{suiteShort}</Link>
            <span className="mx-1.5">/</span>
            <span className="text-gray-900">{tool.name}</span>
          </nav>
          <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-[#5b21b6]">{suite.name}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl text-balance">{tool.name}</h1>
          <p className="mt-4 max-w-3xl text-base text-gray-600 sm:text-lg">{tool.summary}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/auth/register" className="inline-flex items-center gap-2 rounded-full bg-[#5b21b6] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4c1d95]">
              Start using {tool.name} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={tool.appHref} className="inline-flex items-center rounded-full border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50">
              Open in AINOS
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold">What you get</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {tool.features.map(f => (
            <li key={f} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 text-sm text-gray-800 shadow-sm">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" /> {f}
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-gray-600">
          {tool.name} is part of <Link href={`/features/${suite.slug}`} className="font-semibold text-[#5b21b6] hover:text-[#4c1d95]">{suite.name}</Link>,
          and shares customers, products and accounts with every other AINOS suite, so nothing has to be entered twice.
        </p>
      </section>

      {siblings.length > 0 && (
        <section className="border-t border-gray-100 bg-gray-50/60 px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-bold">More tools in {suiteShort}</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {siblings.map(t => (
                <li key={t.slug}>
                  <Link href={`/features/${suite.slug}/${t.slug}`} className="block rounded-xl border border-gray-100 bg-white px-4 py-3 hover:border-purple-200">
                    <span className="block text-sm font-semibold text-gray-900">{t.name}</span>
                    <span className="mt-0.5 block text-xs text-gray-500">{t.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
