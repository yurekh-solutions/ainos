import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Clock,
  Contact2,
  Factory,
  FileSpreadsheet,
  LineChart,
  Package,
  QrCode,
  Scale,
  ShoppingBag,
  Star,
  Truck,
  Wallet,
} from 'lucide-react';
import { absoluteUrl, pageMetadata } from '@/lib/seo';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';
import { CtaBand, PageHero, SectionHeading } from '@/components/marketing/PageHero';

export const metadata: Metadata = pageMetadata({
  title: 'Platform Coverage — GST, Payroll, Logistics',
  description:
    'Twelve areas AINOS covers for Indian businesses: GST invoicing, Tally accounting, EPF and ESI payroll, inventory, dispatch, CRM, compliance and AI Studio.',
  path: '/coverage',
  keywords: [
    'business management platform India',
    'GST billing and payroll software',
    'logistics and dispatch software India',
    'compliance calendar software',
  ],
});

// Every tile maps to a module that exists in the product today. A tile with no
// href is an area AINOS does not sell as a service, and says so.
const COVERAGE = [
  {
    icon: FileSpreadsheet,
    title: 'GST invoicing',
    note: 'CGST, SGST and IGST split, HSN codes and e-invoice fields.',
    href: '/features/finance',
  },
  {
    icon: QrCode,
    title: 'Payment links and UPI',
    note: 'Share a link, and the payer reference is stored against the invoice.',
    href: '/features/finance',
  },
  {
    icon: LineChart,
    title: 'Accounting and Tally',
    note: 'Day book, ledgers, GST reports and Tally-format import or export.',
    href: '/features/accounting',
  },
  {
    icon: Wallet,
    title: 'Payroll with EPF and ESI',
    note: 'Provident fund, ESI and professional tax computed into each payslip.',
    href: '/features/people',
  },
  {
    icon: Clock,
    title: 'Attendance and leave',
    note: 'Shifts, approvals and timesheets that feed the payroll run.',
    href: '/features/people',
  },
  {
    icon: Package,
    title: 'Inventory and warehouses',
    note: 'Stock per location, with transfers and reorder levels.',
    href: '/features/supply-chain',
  },
  {
    icon: Truck,
    title: 'Dispatch and logistics',
    note: 'Challans, e-way bill fields, fleet logs and field jobs.',
    href: '/features/operations',
  },
  {
    icon: Factory,
    title: 'Manufacturing',
    note: 'Bills of material, work orders, work centres and scrap.',
    href: '/features/manufacturing',
  },
  {
    icon: ShoppingBag,
    title: 'Counter and online sales',
    note: 'Register billing, store orders and one stock figure behind both.',
    href: '/features/point-of-sale',
  },
  {
    icon: Contact2,
    title: 'Customers and follow-up',
    note: 'Leads, deals and history beside the invoice they produced.',
    href: '/features/crm',
  },
  {
    icon: Scale,
    title: 'Legal and compliance',
    note: 'Due-date calendar, document vault and draft agreements.',
    href: null,
  },
  {
    icon: Star,
    title: 'AI Studio',
    note: 'Drafting, extraction and analysis under your plan credits.',
    href: '/features/ai-studio',
  },
];

const SHARED_RECORD = [
  {
    title: 'Customers and items are entered once',
    body: 'Billing, dispatch and the sales pipeline read the same customer and item records.',
  },
  {
    title: 'A payment reference stays with the invoice',
    body: 'The UPI reference and its status remain attached to the bill they settle.',
  },
  {
    title: 'Due dates sit beside their documents',
    body: 'Each compliance task carries its category, owner and the files that support it.',
  },
];

export default function CoveragePage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'AINOS coverage',
          description:
            'The twelve areas of business operations covered inside AINOS, each mapped to the module that owns it.',
          url: absoluteUrl('/coverage'),
          inLanguage: 'en-IN',
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: COVERAGE.map((tile, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: tile.title,
              description: tile.note,
            })),
          },
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: absoluteUrl('/') },
          { name: 'Coverage', url: absoluteUrl('/coverage') },
        ])}
      />

      <PageHero
        eyebrow="Coverage"
        title="Everything the business has to bill, pay, move and file."
        description="Twelve areas, each one owned by a module you switch on. Start where the work hurts and leave the rest switched off until you need them."
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Coverage', href: '/coverage' },
        ]}
        actions={[
          { label: 'See the modules', href: '/features' },
          { label: 'Book a walkthrough', href: '/demo', variant: 'secondary' },
        ]}
        aside={
          <div className="rounded-[1.75rem] border border-purple-100 bg-white p-6 shadow-xl shadow-purple-950/5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">What carries over</p>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              None of these areas keeps a private copy of the data. What is entered in one is already visible to the
              others.
            </p>
            <ul className="mt-5 space-y-4">
              {SHARED_RECORD.map((item) => (
                <li key={item.title} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5b21b6]" />
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">{item.title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-gray-600">{item.body}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-xl ainos-surface px-4 py-3 text-xs leading-relaxed text-purple-100/85">
              Each tile links to the module that owns it. Where an area is not listed on this page, AINOS does not claim
              it.
            </div>
          </div>
        }
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <SectionHeading
          eyebrow="Coverage"
          title="The obligations an Indian business carries, in one workspace."
          description="Tax, payroll, stock, dispatch, compliance and content. Each tile is a module you switch on, not a service you have to chase."
        />

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {COVERAGE.map((tile) => {
            const content = (
              <>
                <span className="w-10 h-10 shrink-0 rounded-xl bg-purple-50 ring-1 ring-purple-100 flex items-center justify-center text-[#5b21b6]">
                  <tile.icon className="w-5 h-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">{tile.title}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-gray-600">{tile.note}</span>
                </span>
              </>
            );
            const base = 'flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-gray-100 shadow-sm';
            return tile.href ? (
              <Link
                key={tile.title}
                href={tile.href}
                className={`${base} transition-all hover:-translate-y-0.5 hover:ring-purple-200 hover:shadow-md`}
              >
                {content}
              </Link>
            ) : (
              <div key={tile.title} className={base}>
                {content}
              </div>
            );
          })}
        </div>

        <p className="mt-6 max-w-3xl text-xs leading-relaxed text-gray-500">
          Company formation, corporate travel, insurance and international payment rails sit outside AINOS. The platform
          starts where the business already exists: with its books, stock, people and documents.
        </p>
      </section>

      <CtaBand
        eyebrow="Sequence it"
        title="Add the area with the most overdue work."
        description="Run a real bill, payslip or dispatch through it first. The next area can wait until this one is steady."
        actions={[
          { label: 'Start 14-day trial', href: '/auth/register' },
          { label: 'Talk to the team', href: '/contact', variant: 'secondary' },
        ]}
      />
    </>
  );
}
