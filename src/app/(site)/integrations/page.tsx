import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Bot, Boxes, CreditCard, FileSpreadsheet, Mail, TriangleAlert, UploadCloud } from 'lucide-react';
import { pageMetadata, absoluteUrl } from '@/lib/seo';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';
import { CtaBand, PageHero, SectionHeading } from '@/components/marketing/PageHero';

export const metadata: Metadata = pageMetadata({
  title: 'Integrations — Tally, Razorpay and GST',
  description:
    'What AINOS connects to: Tally and Excel import and export, GSTIN lookup, Razorpay plan billing, email through SMTP or Brevo, Cloudinary media and AI models.',
  path: '/integrations',
  keywords: ['Tally integration', 'GST software integration', 'Razorpay billing integration', 'accounting software integrations India'],
});

const GROUPS = [
  {
    icon: FileSpreadsheet,
    title: 'Accounting and tax',
    summary: 'Move records in and out of the tools your accountant already trusts, and check a GSTIN before it reaches an invoice.',
    items: [
      {
        name: 'Tally import',
        tag: 'Finance plans',
        body: 'Customer, product and ledger masters are read from a Tally export, mapped to AINOS fields, previewed, then imported so opening balances are not retyped.',
      },
      {
        name: 'Tally-compatible export',
        tag: 'Finance plans',
        body: 'Invoices, ledgers and date-range reports export in Tally-compatible formats so month-end work can continue in Tally.',
      },
      {
        name: 'Excel import and export',
        tag: 'Built in',
        body: 'The same import path accepts spreadsheet columns, and any report or register can leave as a spreadsheet for a client or auditor.',
      },
      {
        name: 'GSTIN lookup',
        tag: 'Built in',
        body: 'A GSTIN can be checked before a customer is created, so the legal name and registration status on the invoice match the portal record.',
      },
      {
        name: 'E-invoice ready fields',
        tag: 'Built in',
        body: 'Invoices carry the fields used in e-invoicing workflows. The applicable process depends on your turnover and registration, so confirm the current requirement with your adviser.',
      },
    ],
  },
  {
    icon: CreditCard,
    title: 'Payments',
    summary: 'Subscription billing for the AINOS workspace itself, with the plan, credits and invoice history stored against the company.',
    items: [
      {
        name: 'Razorpay',
        tag: 'Billing',
        body: 'Plan upgrades and AI credit packs are paid through Razorpay, and the payment signature is verified server-side before a subscription is activated.',
      },
      {
        name: 'Payment status in Finance',
        tag: 'Built in',
        body: 'Customer invoices record payment status and the amount received, and pending balances drive the reminder list in Finance.',
      },
    ],
  },
  {
    icon: Mail,
    title: 'Communication',
    summary: 'Invoice emails, password resets, campaign sends and blog delivery all use the same configured transport.',
    items: [
      {
        name: 'SMTP',
        tag: 'Configured per workspace',
        body: 'Any SMTP host can be used for outbound mail, which keeps invoice and reminder emails arriving from the address your customers recognise.',
      },
      {
        name: 'Brevo',
        tag: 'Configured per workspace',
        body: 'Where SMTP is not available, the Brevo transactional API carries the same messages without a domain-level mail setup.',
      },
      {
        name: 'Email campaigns',
        tag: 'Marketing',
        body: 'Campaigns built in Marketing are sent through the same transport, so campaign and transactional mail share one sender identity.',
      },
    ],
  },
  {
    icon: UploadCloud,
    title: 'Files and media',
    summary: 'Documents and images stay available to the record that uses them.',
    items: [
      {
        name: 'Cloudinary',
        tag: 'Built in',
        body: 'Product images, blog media and uploaded documents are stored on Cloudinary and referenced by URL, so a page or invoice template does not break when a file changes.',
      },
      {
        name: 'Invoice templates',
        tag: 'Finance',
        body: 'Template designs render on the server with your company profile, logo and tax details, so the PDF and the on-screen invoice match.',
      },
    ],
  },
  {
    icon: Bot,
    title: 'AI',
    summary: 'AI Studio runs on hosted language and media models, with usage counted as credits under your plan.',
    items: [
      {
        name: 'AI Studio',
        tag: 'Credits',
        body: 'Content drafting, social posts, SEO review, invoice extraction and lead scoring run inside the workspace, using the same customer and product records.',
      },
      {
        name: 'Document extraction',
        tag: 'Credits',
        body: 'An uploaded invoice or business card is read into structured fields that can be reviewed before they create a record.',
      },
    ],
  },
];

const LIMITS = [
  {
    title: 'No public app directory',
    body: 'AINOS does not run an OAuth app marketplace. Connections are the ones listed on this page, configured inside the workspace.',
  },
  {
    title: 'No native QuickBooks or Xero sync',
    body: 'If your accountant works in one of those, the export path is spreadsheet or Tally-compatible files, not a two-way sync.',
  },
  {
    title: 'Custom work is scoped, not promised',
    body: 'Businesses that need a specific endpoint, format or one-way push can discuss it under a custom arrangement rather than assuming it exists today.',
  },
];

export default function IntegrationsPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'AINOS integrations',
          description:
            'Accounting, payment, communication, media and AI connections available inside AINOS.',
          url: absoluteUrl('/integrations'),
          inLanguage: 'en-IN',
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: GROUPS.flatMap((group) => group.items).map((item, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: item.name,
              description: item.body,
            })),
          },
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: absoluteUrl('/') },
          { name: 'Integrations', url: absoluteUrl('/integrations') },
        ])}
      />

      <PageHero
        eyebrow="Integrations"
        title="Connect the systems you already pay for, then remove the ones you do not need."
        description="Take data in from an existing ledger, send it back out for the accountant, and keep the records the team uses daily in one workspace."
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Integrations', href: '/integrations' },
        ]}
        actions={[
          { label: 'See how import works', href: '/features/finance/tally-export', variant: 'secondary' },
          { label: 'Book a walkthrough', href: '/demo' },
        ]}
        aside={
          <div className="rounded-[1.75rem] border border-purple-100 bg-white p-6 shadow-xl shadow-purple-950/5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">On this page</p>
            <ul className="mt-5 space-y-3">
              {GROUPS.map((group) => (
                <li key={group.title} className="flex items-center gap-3 text-sm font-medium text-gray-800">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 ring-1 ring-purple-100">
                    <group.icon className="h-4 w-4 text-[#5b21b6]" />
                  </span>
                  {group.title}
                  <span className="ml-auto text-xs text-gray-400">{group.items.length}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-xl ainos-surface px-4 py-3 text-xs leading-relaxed text-purple-100/85">
              Every connection is configured inside your own workspace. AINOS never needs your accounting login.
            </div>
          </div>
        }
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="space-y-10">
          {GROUPS.map((group) => (
            <div key={group.title} id={group.title.toLowerCase().replace(/[^a-z]+/g, '-')} className="scroll-mt-24">
              <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
                <div className="lg:col-span-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 ring-1 ring-purple-100">
                    <group.icon className="h-5 w-5 text-[#5b21b6]" />
                  </span>
                  <h2 className="mt-5 text-[21px] font-semibold tracking-tight text-gray-950">{group.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600">{group.summary}</p>
                </div>
                <div className="lg:col-span-8">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {group.items.map((item) => (
                      <article key={item.name} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-base font-semibold text-gray-950">{item.name}</h3>
                          <span className="shrink-0 rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-purple-700">
                            {item.tag}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.body}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-purple-100/70 bg-[#fbfaff] py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="What is not included"
            title="The limits, stated before you ask."
            description="A short list of connections AINOS does not claim keeps the evaluation honest and saves a call."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {LIMITS.map((limit) => (
              <div key={limit.title} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-100">
                  <TriangleAlert className="h-5 w-5 text-amber-500" />
                </span>
                <h3 className="mt-5 text-base font-semibold text-gray-950">{limit.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{limit.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-purple-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Boxes className="mt-0.5 h-5 w-5 shrink-0 text-[#5b21b6]" />
              <p className="max-w-2xl text-sm leading-relaxed text-gray-600">
                Need a specific format, endpoint or one-way push? Describe the file or system and the team will say plainly
                whether it is already supported or would need a scoped arrangement.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#5b21b6] transition-colors hover:text-[#4c1d95]"
            >
              Ask about a connection <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="Bring your data with you"
        title="Test the import before you commit to the switch."
        description="Register, import a sample of customers and opening stock, then check the first invoice against your current books."
        actions={[
          { label: 'Start 14-day trial', href: '/auth/register' },
          { label: 'Talk to the team', href: '/contact', variant: 'secondary' },
        ]}
      />
    </>
  );
}
