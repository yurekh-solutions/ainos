import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Boxes,
  Building2,
  Calculator,
  CheckCircle2,
  Contact2,
  Globe2,
  KeyRound,
  Layers,
  LayoutGrid,
  Megaphone,
  MapPin,
  ReceiptText,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { SEO_SUITES } from '@/lib/seo-catalog';
import { pageMetadata, absoluteUrl, SITE_URL, SITE_NAME } from '@/lib/seo';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';
import { CtaBand, FaqList, PageHero, SectionHeading } from '@/components/marketing/PageHero';
import type { FaqItem } from '@/lib/faqs';

const TOOL_COUNT = SEO_SUITES.reduce((total, suite) => total + suite.tools.length, 0);
const SUITE_COUNT = SEO_SUITES.length;

export const metadata: Metadata = pageMetadata({
  title: 'Business Suite — All-in-One Business Software',
  description: `AINOS Business Suite is an all-in-one business suite: ${SUITE_COUNT} suites and ${TOOL_COUNT} tools — GST billing, accounting, CRM, HR, inventory, POS and AI — on one login.`,
  path: '/business-suite',
  keywords: [
    'business suite',
    'all-in-one business suite',
    'business suite software',
    'business management suite',
    'what is a business suite',
    'business suite for small business',
    'ERP alternative',
    'business suite India',
    'global business suite software',
  ],
});

const DEFINITION =
  'A business suite is one platform that runs the core operations of a company — sales, finance, stock, people and marketing — on a shared set of records, instead of a separate app per department.';

const SUITE_REASONS = [
  {
    icon: Layers,
    title: 'One customer record',
    body: 'The lead, the quote, the invoice, the ticket and the payment all point at the same customer, so nobody re-enters a name or reconciles two spellings of it.',
  },
  {
    icon: ReceiptText,
    title: 'Tax documents that agree',
    body: 'A GST invoice, a delivery challan and a day-book entry are three views of one transaction, not three files that have to be matched later.',
  },
  {
    icon: Boxes,
    title: 'Stock that stays current',
    body: 'Counter sales, online orders, purchase receipts and production consumption move the same quantity, so the reorder decision uses a number you can explain.',
  },
  {
    icon: Users,
    title: 'People and payroll in context',
    body: 'Attendance, shifts, timesheets and payroll read employee records kept in the same workspace the rest of the company already uses.',
  },
  {
    icon: KeyRound,
    title: 'Access by role, not by app',
    body: 'Owners, accounts, sales and operations each see the modules their role needs inside one company workspace, instead of sharing logins across tools.',
  },
  {
    icon: Calculator,
    title: 'Reports without exports',
    body: 'Cross-module reporting reads live data, so revenue, receivables, stock value and team cost come from the same source rather than from three spreadsheets.',
  },
];

const COMPARISON = [
  {
    change: 'Customer data',
    separate: 'Duplicated in billing, CRM and support; merged by hand.',
    suite: 'One customer record shared by every module.',
  },
  {
    change: 'Invoices and GST',
    separate: 'Tax split rebuilt in a second system before filing.',
    suite: 'CGST, SGST and IGST applied once, then reused by reports.',
  },
  {
    change: 'Stock and fulfilment',
    separate: 'Reconciled between the shop, the website and the godown.',
    suite: 'One quantity updated by every sale, order and transfer.',
  },
  {
    change: 'Adding a new function',
    separate: 'Another subscription, another import, another login.',
    suite: 'Switch on a module that already reads the same records.',
  },
  {
    change: 'Reporting',
    separate: 'Exports and formulas outside the tools.',
    suite: 'Cross-module reports generated from live data.',
  },
  {
    change: 'Access control',
    separate: 'Per-tool permissions that drift out of step.',
    suite: 'Role-based access across the whole workspace.',
  },
  {
    change: 'Cost',
    separate: 'Several subscriptions, billed and renewed separately.',
    suite: 'One subscription from ₹3,999 per month for the full suite.',
  },
];

const POSITIONING = [
  {
    icon: MapPin,
    title: 'Built in Mumbai',
    body: 'AINOS is developed by Yurekh Solutions Private Limited in Maharashtra, and GST, Tally, e-way bill and payroll rules were part of the design from the first screen.',
  },
  {
    icon: Globe2,
    title: 'Used in any market',
    body: 'The workspace runs in a browser, publishes en-IN and English, and keeps invoices, customers and stock in one place wherever the team is based.',
  },
  {
    icon: ShieldCheck,
    title: 'Data you can take with you',
    body: 'Records sit in a company-scoped workspace with role-based access, and imports and exports support spreadsheet and Tally formats.',
  },
];

const ROLLOUT = [
  {
    step: '01',
    title: 'Start with the workflow that leaks time',
    body: 'Quote to invoice, sale to stock, or order to dispatch. One process, measured before anything else changes.',
  },
  {
    step: '02',
    title: 'Bring the records in',
    body: 'Import customers, products, opening stock and ledgers from spreadsheet or Tally formats, verify a sample, then load the rest.',
  },
  {
    step: '03',
    title: 'Add modules, not migrations',
    body: 'People, marketing, projects and manufacturing read the customers and products already stored, so each new module starts with real data.',
  },
];

// Growth stages keyed to the modules a business actually switches on next, so the
// page answers "what do I get at my size" instead of selling the whole suite at once.
const STAGES = [
  {
    stage: 'Start',
    title: 'First customers, first GST invoices',
    body: 'Issue a tax invoice, send a quotation and share a payment link, then hand the accountant Tally-ready exports instead of a spreadsheet.',
    modules: [
      { label: 'Finance', href: '/features/finance' },
      { label: 'Accounting', href: '/features/accounting' },
    ],
  },
  {
    stage: 'Grow',
    title: 'A sales pipeline and a live stock position',
    body: 'Leads, follow-ups and deals sit beside the stock ledger, so a closed deal reaches billing without anyone retyping it.',
    modules: [
      { label: 'CRM', href: '/features/crm' },
      { label: 'Supply chain', href: '/features/supply-chain' },
      { label: 'People', href: '/features/people' },
    ],
  },
  {
    stage: 'Expand',
    title: 'Counters, godowns and dispatch',
    body: 'Point of sale, warehouses, purchase orders and delivery challans move the same quantity, so the reorder decision uses a number you can explain.',
    modules: [
      { label: 'Point of sale', href: '/features/point-of-sale' },
      { label: 'eCommerce', href: '/features/ecommerce' },
      { label: 'Operations', href: '/features/operations' },
    ],
  },
  {
    stage: 'Scale',
    title: 'Company-wide access, reporting and demand',
    body: 'Role-based access, cross-module reports, campaigns and AI Studio read the same records, whether the team sits in one city or several countries.',
    modules: [
      { label: 'Marketing', href: '/features/marketing' },
      { label: 'AI Studio', href: '/features/ai-studio' },
      { label: 'Workspace', href: '/features/workspace' },
    ],
  },
];

const FAQS: FaqItem[] = [
  {
    question: 'What is a business suite?',
    answer: DEFINITION,
  },
  {
    question: 'What is AINOS Business Suite?',
    answer: `AINOS Business Suite is an all-in-one business suite from Yurekh Solutions, an Indian software company based in Mumbai. It bundles ${SUITE_COUNT} suites and ${TOOL_COUNT} tools — finance, accounting, CRM, inventory, manufacturing, HR and payroll, support, projects, eCommerce, point of sale, operations and AI — behind one login.`,
  },
  {
    question: 'Is AINOS an ERP?',
    answer:
      'A business suite covers the same ground as a small-business ERP: shared records for sales, purchasing, stock, people and finance. AINOS does that without a months-long implementation, and modules can be switched on one workflow at a time.',
  },
  {
    question: 'Is AINOS only for Indian companies?',
    answer:
      'No. AINOS is built in India and is GST-native, which is why Indian teams adopt it quickly, but the workspace runs in a browser and can be used by teams anywhere. Pricing is published in INR and invoices apply Indian tax rules.',
  },
  {
    question: 'How much does AINOS Business Suite cost?',
    answer:
      'AINOS One, the full suite, is ₹3,999 per month. Individual apps start at ₹799 per month and AI Studio is ₹1,499 per month. New companies can start a 14-day AINOS One trial.',
  },
  {
    question: 'Can I buy one module instead of the whole suite?',
    answer:
      'Yes. Each suite can be subscribed on its own, and more can be added later. AINOS One is the simpler choice when several departments need connected data from day one.',
  },
  {
    question: 'How does migration from Tally or spreadsheets work?',
    answer:
      'Customer, product and ledger data can be imported from Tally or Excel formats, and finance supports exporting ledgers back to Tally-compatible formats so your accountant keeps their existing workflow.',
  },
  {
    question: 'Does a business suite replace my accountant?',
    answer:
      'No. AINOS prepares GST-ready records — invoices with tax splits, HSN codes and GSTR-1 and GSTR-3B summaries — so the accountant reviews and files, instead of rebuilding the numbers from scratch.',
  },
];

export default function BusinessSuitePage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': absoluteUrl('/business-suite'),
          url: absoluteUrl('/business-suite'),
          name: 'Business Suite — AINOS Business Suite',
          description: DEFINITION,
          inLanguage: 'en-IN',
          isPartOf: { '@id': `${SITE_URL}/#website` },
          about: { '@id': `${SITE_URL}/#organization` },
          mainEntity: {
            '@type': 'DefinedTerm',
            name: 'Business suite',
            description: DEFINITION,
            inDefinedTermSet: {
              '@type': 'DefinedTermSet',
              name: 'AINOS business glossary',
              url: absoluteUrl('/glossary'),
            },
          },
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `Suites included in ${SITE_NAME}`,
          numberOfItems: SUITE_COUNT,
          itemListElement: SEO_SUITES.map((suite, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: suite.name,
            url: absoluteUrl(`/features/${suite.slug}`),
          })),
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQS.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: faq.answer },
          })),
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: absoluteUrl('/') },
          { name: 'Business Suite', url: absoluteUrl('/business-suite') },
        ])}
      />

      <PageHero
        eyebrow="Business Suite"
        title="One business suite for the whole company, not one login per department."
        description="AINOS Business Suite connects billing, accounting, sales, stock, people, support and marketing on one set of records — so the same customer, product and invoice stay consistent everywhere."
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Business Suite', href: '/business-suite' },
        ]}
        actions={[
          { label: 'Start 14-day trial', href: '/auth/register' },
          { label: 'See plans and pricing', href: '/pricing', variant: 'secondary' },
        ]}
        aside={
          <div className="rounded-[1.75rem] border border-purple-100 bg-white p-6 shadow-xl shadow-purple-950/5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">At a glance</p>
            <dl className="mt-5 grid grid-cols-2 gap-4">
              {[
                [`${SUITE_COUNT}`, 'suites inside one login'],
                [`${TOOL_COUNT}`, 'tools on shared records'],
                ['1', 'customer, product and invoice list'],
                ['GST', 'native on every document'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-[#fbf9ff] px-4 py-3 ring-1 ring-purple-100/70">
                  <dt className="text-xl font-bold text-[#4c1d95]">{value}</dt>
                  <dd className="mt-1 text-xs leading-relaxed text-gray-600">{label}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 rounded-xl ainos-surface px-4 py-3 text-xs leading-relaxed text-purple-100/85">
              Built in Mumbai by Yurekh Solutions. Priced in INR, used across time zones.
            </div>
          </div>
        }
      />

      {/* AEO: the direct answer first, in plain language, before any selling. */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5b21b6]">The definition</p>
            <h2 className="mt-3 text-balance text-[25px] font-semibold leading-[1.24] tracking-tight text-gray-950 sm:text-[30px]">
              What is a business suite?
            </h2>
            <div className="mt-5 space-y-4 text-base leading-relaxed text-gray-600">
              <p className="text-lg font-medium text-gray-900">{DEFINITION}</p>
              <p>
                The difference is not the number of features. It is what happens to the data between them. With
                separate apps, a customer exists once in billing, again in the CRM and a third time in support, and
                every month someone rebuilds the reconciliation by hand. A suite keeps one record and shows it through
                each workflow.
              </p>
              <p>
                AINOS Business Suite applies that model to {SUITE_COUNT} areas of the business, from GST invoicing and
                accounting to inventory, manufacturing, payroll, projects, helpdesk, online stores, counter billing and
                AI-assisted content. Every module reads the same customers, products, employees and documents.
              </p>
              <p>
                Business suites are also described as business management software, business operating systems or
                lightweight ERP platforms. The shared idea is the same: one place to run the company, with modules that
                can be adopted in the order the business needs them.
              </p>
            </div>
            <div className="mt-7 flex flex-wrap gap-2">
              {['Business management suite', 'Business operating system', 'ERP alternative', 'All-in-one software'].map(
                (term) => (
                  <span
                    key={term}
                    className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-[#5b21b6] ring-1 ring-purple-100"
                  >
                    {term}
                  </span>
                ),
              )}
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">A business suite in one line</p>
              <p className="mt-4 text-lg font-semibold leading-snug text-gray-950">
                Every department, one login, one set of records, one bill.
              </p>
              <ul className="mt-5 space-y-3">
                {[
                  'Finance, accounting and GST on the same invoices',
                  'CRM, support and projects on the same customers',
                  'Inventory, POS, eCommerce and manufacturing on the same products',
                  'People, payroll and timesheets on the same employees',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/features"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#5b21b6] transition-colors hover:text-[#4c1d95]"
              >
                Browse all {TOOL_COUNT} tools <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-y border-purple-100/70 bg-[#fbfaff] py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Why one suite"
            title="Six apps means five places the truth can disagree."
            description="These are the seams where disconnected tools cost a growing business time, margin and trust."
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SUITE_REASONS.map((reason) => (
              <article
                key={reason.title}
                className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-950/5"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 ring-1 ring-purple-100">
                  <reason.icon className="h-5 w-5 text-[#5b21b6]" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-gray-950">{reason.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{reason.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <SectionHeading
          eyebrow="Comparison"
          title="Point tools versus one business suite."
          description="Same functions on paper, a different operating model in practice."
        />
        <div className="mt-8 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Separate apps compared with AINOS Business Suite</caption>
            <thead>
              <tr className="bg-[#fbf9ff] text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                <th scope="col" className="px-4 py-4 sm:px-6">What changes</th>
                <th scope="col" className="hidden px-4 py-4 sm:table-cell sm:px-6">Separate apps</th>
                <th scope="col" className="px-4 py-4 text-[#4c1d95] sm:px-6">AINOS Business Suite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 align-top text-sm">
              {COMPARISON.map((row) => (
                <tr key={row.change}>
                  <th scope="row" className="px-4 py-4 font-semibold text-gray-900 sm:px-6">{row.change}</th>
                  <td className="hidden px-4 py-4 leading-relaxed text-gray-500 sm:table-cell sm:px-6">{row.separate}</td>
                  <td className="px-4 py-4 leading-relaxed text-gray-700 sm:px-6">{row.suite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-gray-500">
          AINOS One is the full-suite subscription. Individual suites can also be bought on their own — the comparison
          above describes the default, connected setup.
        </p>
      </section>

      <section className="border-y border-purple-100/70 bg-[#fbfaff] py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Inside the suite"
            title={`${SUITE_COUNT} suites, ${TOOL_COUNT} tools, one workspace.`}
            description="Open any suite to see the tools inside it, what each one does and how it connects to the rest."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SEO_SUITES.map((suite) => (
              <Link
                key={suite.slug}
                href={`/features/${suite.slug}`}
                className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-gray-950 group-hover:text-[#4c1d95]">
                    {suite.name.replace(/^AINOS /, '')}
                  </h3>
                  <span className="shrink-0 rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-[#5b21b6]">
                    {suite.tools.length} tools
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">{suite.summary}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#5b21b6]">
                  Open suite <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>

          {/* The full tool directory: every suite and tool landing page linked once, so a
              visitor can open any module and a crawler reaches all of them from here. */}
          <div className="mt-8 space-y-6 border-t border-purple-100 pt-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <h3 className="text-lg font-semibold text-gray-950">Every tool, by suite</h3>
              <p className="text-sm text-gray-500">
                {TOOL_COUNT} tools across {SUITE_COUNT} suites, each with its own page.
              </p>
            </div>
            <div className="grid gap-7 md:grid-cols-2 md:gap-x-10">
              {SEO_SUITES.map((suite) => (
                <div key={suite.slug}>
                  <div className="flex items-baseline justify-between gap-3 border-b border-gray-100 pb-2">
                    <Link
                      href={`/features/${suite.slug}`}
                      className="text-sm font-semibold text-gray-950 transition-colors hover:text-[#4c1d95]"
                    >
                      {suite.name.replace(/^AINOS /, '')}
                    </Link>
                    <span className="text-[11px] font-semibold tabular-nums text-gray-400">
                      {suite.tools.length}
                    </span>
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {suite.tools.map((tool) => (
                      <li key={tool.slug}>
                        <Link
                          href={`/features/${suite.slug}/${tool.slug}`}
                          className="inline-flex rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-[#4c1d95]"
                        >
                          {tool.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <SectionHeading
          eyebrow="Made in India, built for everywhere"
          title="An Indian business suite that works outside India too."
          description="AINOS was designed around Indian tax and payroll reality and is delivered as a browser workspace any team can use."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {POSITIONING.map((item) => (
            <article key={item.title} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 ring-1 ring-purple-100">
                <item.icon className="h-5 w-5 text-[#5b21b6]" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-gray-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-purple-100 bg-[#fbfaff] p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm leading-relaxed text-purple-900">
            Read the company story, or see how the same platform is configured for retail, wholesale, manufacturing,
            agencies, startups and field operations.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/about"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#4c1d95] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3b0f78]"
            >
              About AINOS
            </Link>
            <Link
              href="/solutions"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-[#4c1d95] transition-colors hover:bg-purple-50"
            >
              Solutions by business <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-purple-100/70 bg-[#fbfaff] py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Adoption"
            title="How teams move onto a suite without stopping the business."
            description="Three steps, in this order. Nothing is switched off until the replacement is proven."
          />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {ROLLOUT.map((step) => (
              <article key={step.step} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-sm font-bold text-purple-700">
                  {step.step}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-gray-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{step.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 border-t border-purple-100 pt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5b21b6]">Start to scale</p>
                <h3 className="mt-3 text-balance text-2xl font-bold tracking-tight text-gray-950 sm:text-[28px]">
                  The same workspace from the first invoice to several branches.
                </h3>
              </div>
              <Link
                href="/pricing"
                className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#5b21b6] transition-colors hover:text-[#4c1d95]"
              >
                See what each stage costs <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {STAGES.map((item) => (
                <li
                  key={item.stage}
                  className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-500">
                    {item.stage}
                  </span>
                  <h4 className="mt-2 text-base font-semibold leading-snug text-gray-950">{item.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.body}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {item.modules.map((mod) => (
                      <Link
                        key={mod.href}
                        href={mod.href}
                        className="rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-[#5b21b6] transition-colors hover:bg-purple-100"
                      >
                        {mod.label}
                      </Link>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <SectionHeading
          eyebrow="Questions"
          title="Business suite questions, answered directly."
          description="If a question is missing, write to info.ainosio@gmail.com and it will be added here."
          align="center"
        />
        <div className="mt-8">
          <FaqList items={FAQS} />
        </div>
        <p className="mt-8 text-center text-sm text-gray-500">
          More answers in the{' '}
          <Link href="/faq" className="font-semibold text-[#5b21b6] hover:text-[#4c1d95]">
            full FAQ
          </Link>
          , and definitions of GST, HSN, GSTR-1 and other terms in the{' '}
          <Link href="/glossary" className="font-semibold text-[#5b21b6] hover:text-[#4c1d95]">
            business glossary
          </Link>
          .
        </p>
      </section>

      <CtaBand
        eyebrow="AINOS Business Suite"
        title="Run the whole company from one login."
        description="Start the 14-day AINOS One trial, invite the team, and switch on the first workflow today. Modules can be added as the business grows."
        actions={[
          { label: 'Start 14-day trial', href: '/auth/register' },
          { label: 'Book a walkthrough', href: '/demo', variant: 'secondary' },
        ]}
      />

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-14 lg:px-8">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">Keep reading</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'All features', href: '/features', icon: LayoutGrid },
            { label: 'Industries', href: '/industries', icon: Building2 },
            { label: 'Pricing', href: '/pricing', icon: Wallet },
            { label: 'Integrations', href: '/integrations', icon: BadgeCheck },
            { label: 'Solutions', href: '/solutions', icon: Contact2 },
            { label: 'Coverage', href: '/coverage', icon: Megaphone },
            { label: 'Security', href: '/security', icon: ShieldCheck },
            { label: 'Glossary', href: '/glossary', icon: BookOpen },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm font-medium text-gray-800 transition-colors hover:border-purple-200 hover:text-[#4c1d95]"
            >
              <link.icon className="h-4 w-4 shrink-0 text-[#5b21b6]" />
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
