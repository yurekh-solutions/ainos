import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Boxes,
  Building2,
  Calculator,
  Contact2,
  HeartHandshake,
  Layers,
  MapPin,
  Megaphone,
  ReceiptText,
  ShieldCheck,
  Users,
  Workflow,
} from 'lucide-react';
import { pageMetadata, absoluteUrl, SITE_URL } from '@/lib/seo';
import { SEO_SUITES } from '@/lib/seo-catalog';
import { COMPANY } from '@/lib/site-content';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';
import { CtaBand, PageHero, SectionHeading } from '@/components/marketing/PageHero';

export const metadata: Metadata = pageMetadata({
  title: 'About AINOS — Business Suite by Yurekh',
  description:
    'AINOS is a unified business suite built in Mumbai by Yurekh Solutions: finance, GST, CRM, inventory, people, marketing and AI connected in one workspace.',
  path: '/about',
  keywords: ['about AINOS', 'Yurekh Solutions', 'Indian business software company', 'business suite India'],
});

const TOOL_COUNT = SEO_SUITES.reduce((total, suite) => total + suite.tools.length, 0);

const CORE_SUITES = [
  {
    icon: ReceiptText,
    title: 'Finance and GST billing',
    description: 'GST invoices, quotes, expenses, payment tracking and Tally-ready exports in one ledger.',
    href: '/features/finance',
  },
  {
    icon: Calculator,
    title: 'Accounting',
    description: 'Day book, profit reports, bank accounts, GST summaries and credit or debit notes.',
    href: '/features/accounting',
  },
  {
    icon: Contact2,
    title: 'CRM and sales',
    description: 'Leads, deals, follow-ups and customer history connected to the invoices they generate.',
    href: '/features/crm',
  },
  {
    icon: Boxes,
    title: 'Inventory and supply chain',
    description: 'Products, stock, warehouses, purchase orders and sales orders without spreadsheet reconciliation.',
    href: '/features/supply-chain',
  },
  {
    icon: Users,
    title: 'People and payroll',
    description: 'Employees, attendance, leave, payroll and compliance records for the team that runs the work.',
    href: '/features/people',
  },
  {
    icon: Megaphone,
    title: 'Marketing and AI',
    description: 'Campaigns, blogs, social content, SEO workflows and an AI studio inside the same workspace.',
    href: '/features/marketing',
  },
];

const PRINCIPLES = [
  {
    icon: Layers,
    title: 'One source of truth',
    description:
      'A customer, product or invoice should exist once. Every module reads the same record instead of asking the team to reconcile copies.',
  },
  {
    icon: ReceiptText,
    title: 'India-first by design',
    description:
      'GST splits, HSN and SAC codes, INR amounts, Tally workflows and Indian business terminology are part of the product, not an afterthought.',
  },
  {
    icon: Workflow,
    title: 'Calm, not crowded',
    description:
      'The workspace is organised around the work a team does each day. Features are added to reduce steps, not to make the menu longer.',
  },
  {
    icon: ShieldCheck,
    title: 'Access with intent',
    description:
      'Company-scoped data and role-based access let an owner, accountant, salesperson and operator work from the same system without sharing one login.',
  },
  {
    icon: HeartHandshake,
    title: 'Partnership over lock-in',
    description:
      'Business data should remain exportable. AINOS supports document export and Tally-compatible workflows so customers are not trapped by their records.',
  },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About AINOS',
          description:
            'AINOS is a unified business suite from Yurekh Solutions, connecting finance, GST, CRM, inventory, people, marketing and AI for Indian businesses.',
          url: absoluteUrl('/about'),
          mainEntity: { '@id': `${SITE_URL}/#organization` },
          publisher: { '@id': `${SITE_URL}/#organization` },
          inLanguage: 'en-IN',
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: absoluteUrl('/') },
          { name: 'About', url: absoluteUrl('/about') },
        ])}
      />

      <PageHero
        eyebrow="About AINOS"
        title="Business software should feel like one system, not seven."
        description="AINOS is built in Mumbai by Yurekh Solutions. Every app works from the same customer, product and money records."
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'About', href: '/about' },
        ]}
        actions={[
          { label: 'Explore the platform', href: '/features' },
          { label: 'Talk to the team', href: '/contact', variant: 'secondary' },
        ]}
        aside={
          <div className="rounded-[1.75rem] border border-purple-100 bg-white p-6 shadow-xl shadow-purple-950/5 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 ring-1 ring-purple-100">
                <Building2 className="h-5 w-5 text-[#5b21b6]" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">Company</p>
                <p className="text-sm font-semibold text-gray-900">{COMPANY.legalName}</p>
              </div>
            </div>
            <dl className="mt-6 divide-y divide-gray-100 text-sm">
              {[
                ['Product', 'AINOS Business Suite'],
                ['Base', COMPANY.location],
                ['Suites', String(SEO_SUITES.length)],
                ['Tools', String(TOOL_COUNT)],
                ['Model', 'Subscription business software'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4 py-3">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="max-w-[62%] text-right font-medium text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-purple-50/70 px-4 py-3 text-xs leading-relaxed text-purple-900">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              Built and operated from Mumbai for businesses across India.
            </div>
          </div>
        }
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <SectionHeading
              eyebrow="Why AINOS exists"
              title="The business grew. The systems did not grow with it."
              description="Most teams do not choose five disconnected tools. It happens one spreadsheet, one app and one group chat at a time."
            />
          </div>
          <div className="space-y-5 text-base leading-relaxed text-gray-600 lg:col-span-7">
            <p>
              A customer is created in the CRM, copied into the billing tool, then emailed again from accounts. Stock sits
              in a warehouse sheet, payroll with an accountant, marketing in another login. Every transfer produces
              another copy of the same fact.
            </p>
            <p>
              AINOS was built on a simpler premise: the customer, product, invoice and team record should serve every
              department. A closed deal reaches accounts without retyping. A raised invoice updates stock and
              receivables. The founder dashboard describes one business.
            </p>
            <p>
              That is why the suite is modular without being fragmented. A team can begin with finance, add CRM as sales
              grows and bring in people or inventory later, while the workspace stays connected. The aim is not more
              software. It is fewer places to look.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-purple-100/70 bg-[#fbfaff] py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="What we build"
            title="A connected suite for the work that runs the company."
            description="Each suite solves a department-level problem. The value is in what they share: customers, products, money and accountability."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CORE_SUITES.map((suite) => (
              <Link
                key={suite.title}
                href={suite.href}
                className="group flex flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-950/5"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 ring-1 ring-purple-100 transition-colors group-hover:bg-[#4c1d95]">
                  <suite.icon className="h-5 w-5 text-[#5b21b6] transition-colors group-hover:text-white" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-gray-950">{suite.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">{suite.description}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#5b21b6]">
                  Explore suite <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-8">
            <Link
              href="/features"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#5b21b6] hover:text-[#4c1d95]"
            >
              See all {SEO_SUITES.length} suites and {TOOL_COUNT} tools <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <SectionHeading
                eyebrow="How we work"
                title="Principles that decide what ships."
                description="A product becomes difficult to trust when every new feature invents its own rules. These are the constraints we keep."
              />

              {/* Fills the empty half of the column with what the product is, at a glance. */}
              <div className="mt-8 rounded-3xl border border-purple-100 bg-[#fbf9ff] p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5b21b6]">AINOS at a glance</p>

                <dl className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <dd className="text-[26px] font-semibold leading-none tracking-tight text-[#4c1d95]">
                      {SEO_SUITES.length}
                    </dd>
                    <dt className="mt-1.5 text-xs font-medium text-gray-500">Suites</dt>
                  </div>
                  <div>
                    <dd className="text-[26px] font-semibold leading-none tracking-tight text-[#4c1d95]">
                      {TOOL_COUNT}
                    </dd>
                    <dt className="mt-1.5 text-xs font-medium text-gray-500">Tools inside them</dt>
                  </div>
                </dl>

                <div className="mt-4 space-y-2.5 border-t border-purple-100 pt-4">
                  <p className="flex items-start gap-2 text-sm text-gray-700">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#5b21b6]" />
                    {COMPANY.location}
                  </p>
                  <p className="flex items-start gap-2 text-sm text-gray-700">
                    <ReceiptText className="mt-0.5 h-4 w-4 shrink-0 text-[#5b21b6]" />
                    GST invoices, e-invoice fields and Tally exports built in
                  </p>
                  <p className="flex items-start gap-2 text-sm text-gray-700">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#5b21b6]" />
                    One login for the owner, accountant and sales team
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-purple-100 pt-4">
                  <Link
                    href="/features"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5b21b6] transition-colors hover:text-[#4c1d95]"
                  >
                    See the suites <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/contact"
                    className="text-sm font-medium text-gray-600 transition-colors hover:text-[#4c1d95]"
                  >
                    Talk to us
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
            {PRINCIPLES.map((principle, index) => (
              <div
                key={principle.title}
                className={`rounded-3xl border border-gray-100 bg-white p-6 shadow-sm ${
                  index === PRINCIPLES.length - 1 ? 'sm:col-span-2' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                    <principle.icon className="h-5 w-5 text-[#5b21b6]" />
                  </span>
                  <h3 className="text-base font-semibold text-gray-950">{principle.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{principle.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-purple-100/70 bg-[#fbfaff] py-12 sm:py-14">
        <div className="mx-auto max-w-3xl text-center px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <Image
              src="/ainos-wordmark.png"
              alt="AINOS"
              width={100}
              height={34}
              className="h-6 w-auto object-contain sm:h-7"
            />
            <span aria-hidden="true" className="h-4 w-px bg-purple-200" />
            <span className="text-sm text-gray-600">
              A product by <span className="font-semibold text-[#4c1d95]">Yurekh Solutions</span>
            </span>
          </div>

          <h2 className="mt-7 text-balance text-[22px] font-semibold leading-[1.25] tracking-tight text-gray-950 sm:text-[26px]">
            Built for how Indian businesses actually operate.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-600">
            AINOS is designed, built and supported by the Yurekh team in Mumbai. The company also works on digital
            products, automation and AI systems through Yurekh.com.
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <a
              href="https://yurekh.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#4c1d95] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#3b0f78]"
            >
              Visit Yurekh <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-800 transition-colors hover:border-purple-200 hover:bg-purple-50"
            >
              Contact AINOS
            </Link>
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="Next step"
        title="Run one real workflow before you decide."
        description="A 14-day trial gives the team the full app set: raise a GST invoice, add the lead it came from and check the stock position in the same workspace."
        actions={[
          { label: 'Start 14-day trial', href: '/auth/register' },
          { label: 'See plans', href: '/pricing', variant: 'secondary' },
        ]}
      />
    </>
  );
}
