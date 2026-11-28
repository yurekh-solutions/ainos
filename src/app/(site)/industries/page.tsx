import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Building2, Layers, ReceiptText } from 'lucide-react';
import { pageMetadata, absoluteUrl } from '@/lib/seo';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';
import { CtaBand, PageHero, SectionHeading } from '@/components/marketing/PageHero';
import { INDUSTRIES } from '@/lib/industries';

export const metadata: Metadata = pageMetadata({
  title: 'Industries — Retail, Wholesale, Manufacturing',
  description:
    'See how retail, wholesale, manufacturing, professional services, startups and field operations teams use AINOS for GST billing, stock, projects and payroll.',
  path: '/industries',
  keywords: ['business software by industry India', 'GST billing for retail', 'manufacturing software India', 'wholesale distribution software'],
});

const SHARED_FOUNDATIONS = [
  {
    icon: ReceiptText,
    title: 'One tax identity',
    body: 'GSTIN, state and document numbering are set once in the company profile, so every invoice, challan and report uses the same details.',
  },
  {
    icon: Layers,
    title: 'One record chain',
    body: 'Customer to quotation to invoice to payment is a single chain. Whichever app raised the document, the next one can read it.',
  },
  {
    icon: Building2,
    title: 'One access model',
    body: 'People are invited into the company workspace with role-scoped access, so the counter, the plant and accounts see different views of the same data.',
  },
];

export default function IndustriesPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'AINOS by industry',
          description:
            'How retail, wholesale, manufacturing, professional services, startup and field operations businesses use AINOS.',
          url: absoluteUrl('/industries'),
          inLanguage: 'en-IN',
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: INDUSTRIES.map((industry, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: industry.name,
              url: absoluteUrl(`/industries/${industry.slug}`),
              item: {
                '@type': 'Service',
                name: `AINOS for ${industry.name}`,
                description: industry.summary,
                provider: { '@id': `${absoluteUrl('/')}#organization` },
              },
            })),
          },
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: absoluteUrl('/') },
          { name: 'Industries', url: absoluteUrl('/industries') },
        ])}
      />

      <PageHero
        eyebrow="Industries"
        title="Software that matches how your industry actually earns."
        description="A garment distributor, a fabrication unit and a design studio need different screens. AINOS keeps tax, customers and money common, and each business enables the workflows it runs."
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Industries', href: '/industries' },
        ]}
        actions={[
          { label: 'Talk to the team', href: '/contact' },
          { label: 'Browse all features', href: '/features', variant: 'secondary' },
        ]}
        aside={
          <div className="rounded-[1.75rem] border border-purple-100 bg-white p-6 shadow-xl shadow-purple-950/5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">Find your operating reality</p>
            <ul className="mt-5 divide-y divide-gray-100">
              {INDUSTRIES.map((industry) => (
                <li key={industry.slug}>
                  <Link
                    href={`/industries/${industry.slug}`}
                    className="group flex items-center justify-between gap-3 py-3 text-sm font-medium text-gray-800 transition-colors hover:text-[#4c1d95]"
                  >
                    <span className="flex items-center gap-3">
                      <industry.icon className="h-4 w-4 text-[#5b21b6]" />
                      {industry.shortName}
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-[#5b21b6]" />
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-xl ainos-surface px-4 py-3 text-xs leading-relaxed text-purple-100/85">
              Not listed? The same modules adjust to trading, services and mixed businesses.
            </div>
          </div>
        }
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <SectionHeading
          eyebrow="Choose your business"
          title="Six starting points, one platform behind them."
          description="Each page covers the problem that shows up first, the apps that remove it, and the order most teams switch them on."
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((industry) => (
            <Link
              key={industry.slug}
              href={`/industries/${industry.slug}`}
              className="group flex flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-950/5"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 ring-1 ring-purple-100 transition-colors group-hover:bg-[#4c1d95]">
                  <industry.icon className="h-5 w-5 text-[#5b21b6] transition-colors group-hover:text-white" />
                </span>
                <ArrowRight className="mt-1 h-4 w-4 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-[#5b21b6]" />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-gray-950">{industry.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{industry.summary}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                {industry.modules.slice(0, 3).map((module) => (
                  <span
                    key={`${industry.slug}-${module.href}`}
                    className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-[#5b21b6]"
                  >
                    {module.label}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-purple-100/70 bg-[#fbfaff] py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="What never changes"
            title="The foundation is the same, only the workflow differs."
            description="Switching tools is expensive because the same facts get re-entered. AINOS keeps one copy and shows each industry the part it needs."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {SHARED_FOUNDATIONS.map((item) => (
              <div key={item.title} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 ring-1 ring-purple-100">
                  <item.icon className="h-5 w-5 text-[#5b21b6]" />
                </span>
                <h3 className="mt-5 text-base font-semibold text-gray-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-purple-100 bg-white p-5 text-sm text-purple-900 shadow-sm">
            <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              Every industry page links to the same feature documentation and the same pricing page, so what you read about
              one workflow is what the whole platform does.
            </p>
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="Bring your own workflow"
        title="Tell us how your business runs, then judge the fit."
        description="Describe the process that costs the most time. We will map it to the apps that touch it and what the first month looks like."
        actions={[
          { label: 'Start 14-day trial', href: '/auth/register' },
          { label: 'Book a walkthrough', href: '/demo', variant: 'secondary' },
        ]}
      />
    </>
  );
}
