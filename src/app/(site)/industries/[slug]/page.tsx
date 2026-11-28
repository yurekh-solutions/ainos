import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, CircleAlert, Compass } from 'lucide-react';
import { pageMetadata, absoluteUrl } from '@/lib/seo';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';
import { CtaBand, FaqList, PageHero, SectionHeading } from '@/components/marketing/PageHero';
import { INDUSTRIES, INDUSTRY_SLUGS, getIndustry } from '@/lib/industries';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return INDUSTRY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const industry = getIndustry(slug);
  if (!industry) return { title: 'Industry not found' };

  return pageMetadata({
    title: industry.metaTitle,
    description: industry.metaDescription,
    path: `/industries/${industry.slug}`,
    keywords: industry.keywords,
  });
}

export default async function IndustryPage({ params }: Props) {
  const { slug } = await params;
  const industry = getIndustry(slug);
  if (!industry) notFound();

  const path = `/industries/${industry.slug}`;
  const related = INDUSTRIES.filter((item) => item.slug !== industry.slug).slice(0, 3);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          '@id': `${absoluteUrl(path)}#service`,
          name: `AINOS for ${industry.name}`,
          serviceType: `Business management software for ${industry.name.toLowerCase()}`,
          description: industry.metaDescription,
          url: absoluteUrl(path),
          areaServed: { '@type': 'Country', name: 'India' },
          provider: { '@id': `${absoluteUrl('/')}#organization` },
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: `Apps used by ${industry.name.toLowerCase()} teams`,
            itemListElement: industry.modules.map((module) => ({
              '@type': 'Offer',
              itemOffered: {
                '@type': 'SoftwareApplication',
                name: `AINOS ${module.label}`,
                url: absoluteUrl(module.href),
                applicationCategory: 'BusinessApplication',
              },
            })),
          },
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          '@id': `${absoluteUrl(path)}#faq`,
          mainEntity: industry.faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: faq.answer },
          })),
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: absoluteUrl('/') },
          { name: 'Industries', url: absoluteUrl('/industries') },
          { name: industry.name, url: absoluteUrl(path) },
        ])}
      />

      <PageHero
        eyebrow={industry.eyebrow}
        title={industry.headline}
        description={industry.intro}
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Industries', href: '/industries' },
          { name: industry.name, href: path },
        ]}
        actions={[
          { label: 'Start 14-day trial', href: '/auth/register' },
          { label: 'Book a walkthrough', href: '/demo', variant: 'secondary' },
        ]}
        aside={
          <div className="rounded-[1.75rem] border border-purple-100 bg-white p-6 shadow-xl shadow-purple-950/5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">Apps in play</p>
            <ul className="mt-5 space-y-4">
              {industry.modules.map((module) => (
                <li key={module.href} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <Link
                    href={module.href}
                    className="group flex items-center justify-between gap-3 text-sm font-semibold text-gray-900 transition-colors hover:text-[#4c1d95]"
                  >
                    {module.label}
                    <ArrowRight className="h-4 w-4 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-[#5b21b6]" />
                  </Link>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">{module.note}</p>
                </li>
              ))}
            </ul>
            <p className="mt-5 rounded-xl bg-[#fbfaff] px-4 py-3 text-xs leading-relaxed text-purple-900">
              Subscribe only the apps in use. AINOS One connects them when several teams share the same records.
            </p>
          </div>
        }
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <SectionHeading
          eyebrow="Recurring problems"
          title={`Where ${industry.shortName.toLowerCase()} teams lose the most time.`}
          description="Different wording each time, same cause: records that stop talking to each other."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {industry.painPoints.map((point, index) => (
            <div key={point.title} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 ring-1 ring-rose-100">
                  <CircleAlert className="h-5 w-5 text-rose-500" />
                </span>
                <span className="text-xs font-bold text-gray-300">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="mt-5 text-base font-semibold text-gray-950">{point.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{point.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-purple-100/70 bg-[#fbfaff] py-12 sm:py-14">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-12 lg:gap-12 px-4 sm:px-6 lg:px-8">
          <div className="lg:col-span-5">
            <SectionHeading
              eyebrow="How it runs"
              title="From the first document to the final invoice."
              description={`The path a ${industry.shortName.toLowerCase()} job takes. Each step writes to the record the next step reads.`}
            />
            <div className="mt-7 flex items-start gap-3 rounded-2xl border border-purple-100 bg-white p-4 text-sm text-purple-900 shadow-sm">
              <Compass className="mt-0.5 h-5 w-5 shrink-0" />
              <p>Switch on one step first. The rest read the records it creates.</p>
            </div>
          </div>
          <div className="lg:col-span-7">
            <ol className="space-y-3">
              {industry.workflow.map((step, index) => (
                <li key={step.title} className="flex gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4c1d95] to-[#6d28d9] text-xs font-bold text-white">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-gray-950">{step.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <SectionHeading
          eyebrow="What each app owns"
          title="Responsibility, split by app."
          description="Every business gets the same platform. What you switch on depends on the workflow, not the label."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {industry.modules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="group flex items-start justify-between gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-950/5"
            >
              <div>
                <h3 className="text-base font-semibold text-gray-950">{module.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{module.note}</p>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-[#5b21b6]" />
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-purple-100/70 bg-[#fbfaff] py-12 sm:py-14">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-12 lg:gap-12 px-4 sm:px-6 lg:px-8">
          <div className="lg:col-span-4">
            <SectionHeading
              eyebrow="Questions"
              title={`${industry.name} questions, answered.`}
              description="What buyers ask before opening a trial."
            />
            <Link
              href="/faq"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#5b21b6] transition-colors hover:text-[#4c1d95]"
            >
              Read all questions <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="lg:col-span-8">
            <FaqList items={industry.faqs} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="flex flex-col gap-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">Other industries</p>
            <h2 className="mt-3 text-[19px] font-semibold tracking-tight text-gray-950 sm:text-[22px]">
              Compare the same platform from another business type.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Each page shows a different starting point, not a different product.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={`/industries/${item.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:border-purple-200 hover:bg-purple-50 hover:text-[#4c1d95]"
              >
                <item.icon className="h-4 w-4 text-[#5b21b6]" />
                {item.shortName}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow={`AINOS for ${industry.shortName.toLowerCase()}`}
        title={industry.summary}
        description="Bring a sample of real data into a trial and run the workflow you are evaluating."
        actions={[
          { label: 'Start 14-day trial', href: '/auth/register' },
          { label: 'Talk to the team', href: '/contact', variant: 'secondary' },
        ]}
      />
    </>
  );
}
