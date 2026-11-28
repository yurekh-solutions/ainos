import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRight, CheckCircle2, Layers, Sparkles, Users } from 'lucide-react';
import { SEO_SUITES, suiteBySlug } from '@/lib/seo-catalog';
import { pageMetadata, absoluteUrl, metaDescription } from '@/lib/seo';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';
import { FaqList } from '@/components/marketing/PageHero';
import { faqPageJsonLd, getSuiteContent } from '@/lib/content';

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

  const suiteShort = suite.name.replace(/^AINOS /, '');
  const url = absoluteUrl(`/features/${suite.slug}`);
  const content = getSuiteContent(suite.slug);
  const others = SEO_SUITES.filter(s => s.slug !== suite.slug);
  const pairs = content.pairsWith
    .map(slug => suiteBySlug(slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const faqJsonLd = faqPageJsonLd(url, content.faqs);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          '@id': url,
          url,
          name: `${suite.name} — ${suite.headline}`,
          description: content.answer,
          inLanguage: ['en-IN', 'en'],
          isPartOf: { '@type': 'WebSite', name: 'AINOS Business Suite', url: absoluteUrl('/') },
          mainEntity: { '@id': `${url}#tools` },
          speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', '.answer-block'] },
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          '@id': `${url}#software`,
          name: suite.name,
          applicationCategory: 'BusinessApplication',
          applicationSubCategory: 'Business suite module',
          operatingSystem: 'Web',
          description: suite.summary,
          url,
          featureList: suite.tools.map(t => t.name),
          publisher: { '@type': 'Organization', name: 'AINOS', url: absoluteUrl('/') },
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          '@id': `${url}#tools`,
          name: `Tools in ${suite.name}`,
          numberOfItems: suite.tools.length,
          itemListElement: suite.tools.map((tool, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: tool.name,
            url: absoluteUrl(`/features/${suite.slug}/${tool.slug}`),
          })),
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: absoluteUrl('/') },
          { name: 'Features', url: absoluteUrl('/features') },
          { name: suite.name, url },
        ])}
      />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}

      <section className="bg-gradient-to-b from-purple-50/70 to-white pb-12 pt-10 sm:pb-14 sm:pt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="text-xs text-gray-500">
            <Link href="/" className="hover:text-gray-900">Home</Link>
            <span className="mx-1.5">/</span>
            <Link href="/features" className="hover:text-gray-900">Features</Link>
            <span className="mx-1.5">/</span>
            <span className="text-gray-900">{suiteShort}</span>
          </nav>
          <h1 className="mt-6 text-[27px] font-semibold leading-[1.22] tracking-tight text-gray-950 sm:text-[31px] md:text-[34px] lg:text-[36px] text-balance">{suite.name}</h1>
          <p className="mt-3 text-lg font-medium text-[#5b21b6] sm:text-xl">{suite.headline}</p>
          <p className="mt-4 max-w-3xl text-base text-gray-600">{suite.summary}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/auth/register" className="inline-flex items-center gap-2 rounded-full bg-[#5b21b6] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4c1d95]">
              Get started with {suiteShort} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/auth/signin" className="inline-flex items-center rounded-full border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Direct answer: the passage answer engines quote for "what is <suite>" questions. */}
      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-12 lg:px-8">
        <div className="answer-block grid gap-6 rounded-2xl border border-purple-100 bg-[#faf8ff] p-6 sm:p-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-8">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#5b21b6]">
              <Sparkles className="h-3.5 w-3.5" /> In short
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-gray-800 sm:text-base">{content.answer}</p>
          </div>
          <div className="lg:col-span-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#5b21b6]">
              <Users className="h-3.5 w-3.5" /> Built for
            </p>
            <ul className="mt-3 space-y-2">
              {content.audience.map(item => (
                <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-gray-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5b21b6]" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {content.problems.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-950">What {suiteShort} closes</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {content.problems.map(problem => (
              <div key={problem.title} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-gray-950">{problem.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{problem.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {content.workflow.length > 0 && (
        <section className="border-y border-gray-100 bg-gray-50/60 py-12 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-4">
                <h2 className="text-2xl font-bold text-gray-950">How the workflow runs</h2>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  One transaction, carried from first entry to the report that reads it, without leaving the suite.
                </p>
              </div>
              <ol className="space-y-5 lg:col-span-8">
                {content.workflow.map((step, index) => (
                  <li key={step.title} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-50 text-xs font-bold text-[#5b21b6]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-950">{step.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-gray-600">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <h2 className="text-2xl font-bold">Tools in {suite.name}</h2>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          {suite.tools.length} tools in this suite, each with its own page describing what it does and how it fits the workflow.
        </p>
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

      {content.faqs.length > 0 && (
        <section className="border-t border-gray-100 bg-gray-50/60 py-12 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-4">
                <h2 className="text-2xl font-bold text-gray-950">{suiteShort} questions</h2>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  The questions buyers ask before they move this part of the business onto AINOS.
                </p>
                <Link href="/faq" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#5b21b6] hover:text-[#4c1d95]">
                  All AINOS answers <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="lg:col-span-8">
                <FaqList items={content.faqs} />
              </div>
            </div>
          </div>
        </section>
      )}

      {pairs.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-950">
            <Layers className="h-5 w-5 text-[#5b21b6]" /> {suiteShort} works best with
          </h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-3">
            {pairs.map(p => (
              <li key={p.slug}>
                <Link href={`/features/${p.slug}`} className="block h-full rounded-xl border border-gray-100 bg-white p-5 hover:border-purple-200">
                  <span className="block text-sm font-semibold text-gray-950">{p.name}</span>
                  <span className="mt-1.5 block text-xs leading-relaxed text-gray-500">{p.headline}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="border-t border-gray-100 bg-gray-50/60 py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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