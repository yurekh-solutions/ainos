import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Briefcase,
  Building2,
  Calculator,
  Contact2,
  Factory,
  Megaphone,
  Rocket,
  ShoppingBag,
  Truck,
  UserRound,
  Users,
} from 'lucide-react';
import { pageMetadata, absoluteUrl } from '@/lib/seo';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';
import { CtaBand, PageHero, SectionHeading } from '@/components/marketing/PageHero';

export const metadata: Metadata = pageMetadata({
  title: 'Solutions by Business Type — AINOS',
  description:
    'How each business type and desk starts on AINOS: the modules switched on first for startups, agencies, retail, distribution, manufacturing and services.',
  path: '/solutions',
  keywords: ['business software by industry', 'GST billing for retailers', 'CRM for agencies', 'inventory software India'],
});

const AUDIENCES = [
  {
    icon: Rocket,
    title: 'Startups and new businesses',
    summary: 'Set up billing, a pipeline and staff records before the tooling becomes permanent.',
    start: 'Begin with Finance and CRM.',
    links: [
      { label: 'CRM', href: '/features/crm' },
      { label: 'Finance', href: '/features/finance' },
      { label: 'Projects', href: '/features/workspace' },
    ],
  },
  {
    icon: Briefcase,
    title: 'Agencies and consultancies',
    summary: 'Keep proposals, delivery and invoices attached to one client record.',
    start: 'Begin with CRM and Projects.',
    links: [
      { label: 'CRM', href: '/features/crm' },
      { label: 'Projects', href: '/features/workspace' },
      { label: 'Finance', href: '/features/finance' },
    ],
  },
  {
    icon: ShoppingBag,
    title: 'Retail and eCommerce',
    summary: 'Sell at the counter and online against a single stock figure.',
    start: 'Begin with POS and Inventory.',
    links: [
      { label: 'eCommerce', href: '/features/ecommerce' },
      { label: 'Inventory', href: '/features/supply-chain' },
      { label: 'POS', href: '/features/point-of-sale' },
    ],
  },
  {
    icon: Truck,
    title: 'Distribution and wholesale',
    summary: 'Track purchasing, dispatch and receivables across a growing dealer base.',
    start: 'Begin with Supply Chain and Finance.',
    links: [
      { label: 'Supply chain', href: '/features/supply-chain' },
      { label: 'Finance', href: '/features/finance' },
      { label: 'Accounting', href: '/features/accounting' },
    ],
  },
  {
    icon: Factory,
    title: 'Manufacturing',
    summary: 'Plan material, production and billing from the same build record.',
    start: 'Begin with Manufacturing and Inventory.',
    links: [
      { label: 'Manufacturing', href: '/features/manufacturing' },
      { label: 'Inventory', href: '/features/supply-chain' },
      { label: 'Finance', href: '/features/finance' },
    ],
  },
  {
    icon: Building2,
    title: 'Professional services',
    summary: 'Give every engagement one home for scope, time and fees.',
    start: 'Begin with Projects and Finance.',
    links: [
      { label: 'CRM', href: '/features/crm' },
      { label: 'Projects', href: '/features/workspace' },
      { label: 'Finance', href: '/features/finance' },
    ],
  },
];

const ROLE_CARDS = [
  {
    icon: UserRound,
    role: 'Founder or owner',
    value: 'Revenue, receivables, stock and activity on one screen.',
    href: '/features/workspace',
  },
  {
    icon: Calculator,
    role: 'Accounts',
    value: 'GST invoices, reconciliation and reports without retyping sales.',
    href: '/features/accounting',
  },
  {
    icon: Contact2,
    role: 'Sales',
    value: 'A pipeline with customer history attached to every deal.',
    href: '/features/crm',
  },
  {
    icon: Boxes,
    role: 'Operations',
    value: 'Stock, purchase orders and fulfilment from one catalogue.',
    href: '/features/supply-chain',
  },
  {
    icon: Users,
    role: 'People and HR',
    value: 'Employee records, attendance and payroll finance can audit.',
    href: '/features/people',
  },
  {
    icon: Megaphone,
    role: 'Marketing',
    value: 'Campaigns built on the customer and product data already stored.',
    href: '/features/marketing',
  },
];

const ROLLOUT = [
  {
    step: '01',
    title: 'Pick the first workflow',
    description: 'Start where follow-up costs the most: quote to invoice, sale to stock, or order to dispatch.',
  },
  {
    step: '02',
    title: 'Bring the source data in',
    description: 'Import customers, products, opening stock and ledgers from spreadsheet or Tally formats.',
  },
  {
    step: '03',
    title: 'Give each role its access',
    description: 'Invite the team with company-scoped permissions, so each desk sees only what it needs.',
  },
  {
    step: '04',
    title: 'Extend when it proves out',
    description: 'Add people, marketing or projects once the first workflow is stable. No second migration.',
  },
];

export default function SolutionsPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'AINOS solutions by business type',
          description:
            'How startups, agencies, retailers, distributors, manufacturers and professional service businesses use AINOS.',
          url: absoluteUrl('/solutions'),
          inLanguage: 'en-IN',
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: AUDIENCES.map((audience, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: {
                '@type': 'Service',
                name: audience.title,
                description: audience.summary,
                provider: { '@id': `${absoluteUrl('/')}#organization` },
              },
            })),
          },
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: absoluteUrl('/') },
          { name: 'Solutions', url: absoluteUrl('/solutions') },
        ])}
      />

      <PageHero
        eyebrow="Solutions"
        title="Start from the business you run, not a blank workspace."
        description="Six business types and six desks. Pick the closest match and see which modules that team turns on first."
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Solutions', href: '/solutions' },
        ]}
        actions={[
          { label: 'Browse all features', href: '/features' },
          { label: 'Compare plans', href: '/pricing', variant: 'secondary' },
        ]}
        aside={
          <div className="rounded-[1.75rem] border border-purple-100 bg-white p-6 shadow-xl shadow-purple-950/5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">A staged rollout</p>
            <div className="mt-5 space-y-4">
              {[
                ['01', 'Choose one process', 'Start where follow-up costs the most time.'],
                ['02', 'Invite the people', 'Same records, permissions by role.'],
                ['03', 'Extend when stable', 'New modules read the data already there.'],
              ].map(([number, title, description]) => (
                <div key={number} className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-50 text-xs font-bold text-purple-700">
                    {number}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-950">{title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl ainos-surface px-4 py-3 text-xs leading-relaxed text-purple-100/85">
              Adopt in sequence. Each module works from the records the previous one created.
            </div>
          </div>
        }
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <SectionHeading
          eyebrow="By business type"
          title="Choose the operating model closest to yours."
          description="Six common setups. Same platform, a different starting point."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {AUDIENCES.map((audience) => (
            <article
              key={audience.title}
              className="flex flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-950/5"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 ring-1 ring-purple-100">
                <audience.icon className="h-5 w-5 text-[#5b21b6]" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-gray-950">{audience.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{audience.summary}</p>
              <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#5b21b6]" />
                <p className="text-sm font-medium text-gray-700">{audience.start}</p>
              </div>
              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                {audience.links.map((link) => (
                  <Link
                    key={`${audience.title}-${link.href}`}
                    href={link.href}
                    className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-[#5b21b6] transition-colors hover:bg-purple-100"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-purple-100 bg-[#fbfaff] p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm leading-relaxed text-purple-900">
            Each business type also has a dedicated page with its friction points, the apps used first and the order of rollout.
          </p>
          <Link
            href="/industries"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#5b21b6] transition-colors hover:text-[#4c1d95]"
          >
            Browse industry pages <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="border-y border-purple-100/70 bg-[#fbfaff] py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="By role"
            title="One system, viewed from each desk."
            description="Every role works with the records it needs. Nobody has to learn the whole company to do their job."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ROLE_CARDS.map((card) => (
              <Link
                key={card.role}
                href={card.href}
                className="group flex flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-950/5"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 ring-1 ring-purple-100 transition-colors group-hover:bg-[#4c1d95]">
                    <card.icon className="h-5 w-5 text-[#5b21b6] transition-colors group-hover:text-white" />
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-[#5b21b6]" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-gray-950">{card.role}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{card.value}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <SectionHeading
              eyebrow="Adoption"
              title="Prove one workflow before starting the next."
              description="A platform change fails when it becomes a company-wide event. Sequence it instead."
            />
            <div className="mt-7 flex items-center gap-3 rounded-2xl border border-purple-100 bg-purple-50/60 p-4 text-sm text-purple-900">
              <BarChart3 className="h-5 w-5 shrink-0" />
              <p>Judge each stage by the manual follow-up it removes.</p>
            </div>
          </div>
          <div className="lg:col-span-7">
            <ol className="space-y-3">
              {ROLLOUT.map((item) => (
                <li key={item.step} className="flex gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4c1d95] to-[#6d28d9] text-xs font-bold text-white">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-gray-950">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{item.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="Next step"
        title="Start with the process that costs you the most time."
        description="Open a trial, bring a sample of real data and test the workflow you are evaluating."
        actions={[
          { label: 'Start 14-day trial', href: '/auth/register' },
          { label: 'Talk to the team', href: '/contact', variant: 'secondary' },
        ]}
      />
    </>
  );
}
