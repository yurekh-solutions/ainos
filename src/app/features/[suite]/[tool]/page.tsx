import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRight, CheckCircle2, Link2, Sparkles, Users } from 'lucide-react';
import { SEO_SUITES, toolBySlugs } from '@/lib/seo-catalog';
import { pageMetadata, absoluteUrl, metaDescription } from '@/lib/seo';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';
import { FaqList } from '@/components/marketing/PageHero';
import { faqPageJsonLd, getToolContent, getSuiteContent, resolveToolLinks } from '@/lib/content';

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
  const suiteShort = suite.name.replace(/^AINOS /, '');
  // The root template appends " | AINOS", so keep the page part short enough that
  // the whole listing stays inside Google's ~60-character window.
  const withSuite = `${tool.name} — ${suiteShort} Software`;
  const title = withSuite.length <= 52 ? withSuite : `${tool.name} Software`;
  return pageMetadata({
    title,
    description: metaDescription(tool.summary, tool.features.map(f => f.charAt(0).toLowerCase() + f.slice(1))),
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
  const content = getToolContent(suite.slug, tool.slug);
  const suiteContent = getSuiteContent(suite.slug);
  const worksWith = resolveToolLinks(content.links);
  const faqJsonLd = faqPageJsonLd(url, content.faqs);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          '@id': `${url}#software`,
          name: `AINOS ${tool.name}`,
          alternateName: tool.name,
          applicationCategory: 'BusinessApplication',
          applicationSubCategory: suite.name,
          operatingSystem: 'Web',
          description: tool.summary,
          url,
          featureList: tool.features,
          keywords: tool.keywords.join(', '),
          isPartOf: {
            '@type': 'SoftwareApplication',
            name: 'AINOS Business Suite',
            url: absoluteUrl('/'),
          },
          publisher: {
            '@type': 'Organization',
            name: 'AINOS',
            url: absoluteUrl('/'),
          },
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': url,
          url,
          name: `${tool.name} — ${suite.name}`,
          description: content.answer,
          inLanguage: ['en-IN', 'en'],
          about: { '@id': `${url}#software` },
          isPartOf: { '@type': 'WebSite', name: 'AINOS Business Suite', url: absoluteUrl('/') },
          speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', '.answer-block'] },
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
      {faqJsonLd && <JsonLd data={faqJsonLd} />}

      <section className="bg-gradient-to-b from-purple-50/70 to-white pb-12 pt-10 sm:pb-14 sm:pt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
          <h1 className="mt-2 text-[27px] font-semibold leading-[1.22] tracking-tight text-gray-950 sm:text-[31px] md:text-[34px] lg:text-[36px] text-balance">{tool.name}</h1>
          <p className="mt-4 max-w-3xl text-base text-gray-600 sm:text-lg">{tool.summary}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/auth/register" className="inline-flex items-center gap-2 rounded-full bg-[#5b21b6] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4c1d95]">
              Start using {tool.name} <ArrowRight className="h-4 w-4" />
            </Link>
            {/* The app screen sits behind sign-in and is blocked in robots.txt. */}
            <Link href={tool.appHref} rel="nofollow" className="inline-flex items-center rounded-full border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50">
              Open in AINOS
            </Link>
          </div>
        </div>
      </section>

      {/* Direct answer first: the passage an AI Overview or a chat answer quotes. */}
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
              <Users className="h-3.5 w-3.5" /> Who it is for
            </p>
            <ul className="mt-3 space-y-2">
              {content.bestFor.map(item => (
                <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-gray-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5b21b6]" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <h2 className="text-2xl font-bold text-gray-950">How {tool.name} works</h2>
            <ol className="mt-6 space-y-5">
              {content.steps.map((step, index) => (
                <li key={step.title} className="flex gap-4">
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

          <div className="lg:col-span-5">
            <h2 className="text-2xl font-bold text-gray-950">What you get</h2>
            <ul className="mt-6 grid gap-3">
              {tool.features.map(f => (
                <li key={f} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 text-sm text-gray-800 shadow-sm">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" /> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-10 max-w-3xl text-sm text-gray-600">
          {tool.name} is part of{' '}
          <Link href={`/features/${suite.slug}`} className="font-semibold text-[#5b21b6] hover:text-[#4c1d95]">{suite.name}</Link>
          , and shares customers, products and accounts with every other AINOS suite, so nothing has to be entered twice.
        </p>
      </section>

      {worksWith.length > 0 && (
        <section className="border-y border-gray-100 bg-gray-50/60 py-12 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-950">
              <Link2 className="h-5 w-5 text-[#5b21b6]" /> Works with
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Records this screen creates are the same records these tools read, so the workflow continues without an export.
            </p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {worksWith.map(item => (
                <li key={item.href}>
                  <Link href={item.href} className="block h-full rounded-xl border border-gray-100 bg-white p-5 transition-colors hover:border-purple-200">
                    <span className="block text-sm font-semibold text-gray-950">{item.name}</span>
                    <span className="mt-1.5 block text-xs leading-relaxed text-gray-500">{item.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {content.faqs.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-4">
              <h2 className="text-2xl font-bold text-gray-950">{tool.name} questions</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Short, direct answers about how {tool.name.toLowerCase()} behaves inside the AINOS Business Suite.
              </p>
              <Link href="/faq" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#5b21b6] hover:text-[#4c1d95]">
                All AINOS answers <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="lg:col-span-8">
              <FaqList items={content.faqs} />
            </div>
          </div>
        </section>
      )}

      {siblings.length > 0 && (
        <section className="border-t border-gray-100 bg-gray-50/60 py-12 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/features/${suite.slug}`} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 hover:border-purple-200 hover:bg-purple-50">
                Explore {suiteShort} <ArrowRight className="h-4 w-4" />
              </Link>
              {suiteContent.pairsWith.length > 0 && (
                <Link href="/features" className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 hover:border-purple-200 hover:bg-purple-50">
                  All {SEO_SUITES.length} suites <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}