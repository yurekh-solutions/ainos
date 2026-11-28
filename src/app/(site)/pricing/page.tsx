import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Boxes,
  Briefcase,
  Building2,
  Check,
  Contact2,
  Headphones,
  LayoutGrid,
  Megaphone,
  ReceiptText,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { pageMetadata, absoluteUrl } from '@/lib/seo';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';
import { CtaBand, FaqList, PageHero, SectionHeading } from '@/components/marketing/PageHero';
import { CHANGE_PLAN, CREDITS, CUSTOM_PLAN, PRICING, TRIAL } from '@/lib/faqs';

export const metadata: Metadata = pageMetadata({
  title: 'Pricing — AINOS One, Apps and AI Studio',
  description:
    'AINOS pricing in INR: AINOS One at ₹3,999 per month, individual business apps from ₹799 per month and AI Studio at ₹1,499 per month. Start a 14-day trial.',
  path: '/pricing',
  keywords: ['AINOS pricing', 'business software price India', 'GST billing software pricing', 'ERP subscription India'],
});

const ONE_PRICE = 3999;
const APP_PRICE = 799;
const AI_STUDIO_PRICE = 1499;
const TRIAL_DAYS = 14;

const INDIVIDUAL_APPS = [
  { name: 'CRM', description: 'Contacts, deals, follow-ups and customers.', icon: Contact2 },
  { name: 'Books', description: 'Invoices, products and payment tracking.', icon: ReceiptText },
  { name: 'People', description: 'Employees, attendance, payroll and leave.', icon: Users },
  { name: 'Inventory', description: 'Stock, warehouses and purchase orders.', icon: Boxes },
  { name: 'Campaigns', description: 'Email campaigns, blog and content.', icon: Megaphone },
  { name: 'Desk', description: 'Helpdesk tickets and customer support.', icon: Headphones },
  { name: 'Projects', description: 'Projects, task boards and deadlines.', icon: LayoutGrid },
];

const COMPARISON = [
  { feature: 'GST invoicing and tax splits', one: 'Included', individual: 'Books', custom: true },
  { feature: 'Accounting and GST reports', one: 'Included', individual: 'Books', custom: true },
  { feature: 'CRM and sales pipeline', one: 'Included', individual: 'CRM', custom: true },
  { feature: 'Inventory and purchase orders', one: 'Included', individual: 'Inventory', custom: true },
  { feature: 'Employees, attendance and payroll', one: 'Included', individual: 'People', custom: true },
  { feature: 'Marketing and blog workflows', one: 'Included', individual: 'Campaigns', custom: true },
  { feature: 'Projects and helpdesk', one: 'Included', individual: 'Projects or Desk', custom: true },
  { feature: 'AI Studio tools', one: 'Included', individual: 'AI Studio add-on', custom: true },
  { feature: 'One connected workspace', one: true, individual: false, custom: true },
  { feature: 'Role-based team access', one: true, individual: true, custom: true },
];

const PRICING_FAQS = [TRIAL, PRICING, CREDITS, CUSTOM_PLAN, CHANGE_PLAN];

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center rounded-full bg-green-50 p-1 text-green-700">
        <Check className="h-4 w-4" />
      </span>
    );
  }
  if (value === false) {
    return <span className="text-sm text-gray-300">—</span>;
  }
  return <span className="text-sm font-medium text-gray-700">{value}</span>;
}

export default function PricingPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'AINOS Business Suite',
          description:
            'A connected business suite with GST billing, accounting, CRM, inventory, people, marketing, projects, helpdesk and AI tools.',
          brand: { '@type': 'Brand', name: 'AINOS' },
          url: absoluteUrl('/pricing'),
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'INR',
            lowPrice: APP_PRICE,
            highPrice: ONE_PRICE,
            offerCount: 3,
            availability: 'https://schema.org/InStock',
            url: absoluteUrl('/pricing'),
          },
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: PRICING_FAQS.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: absoluteUrl('/') },
          { name: 'Pricing', url: absoluteUrl('/pricing') },
        ])}
      />

      <PageHero
        eyebrow="Pricing"
        title="One platform, three ways to start."
        description="Run the full suite, subscribe individual apps, or add AI Studio credits. A 14-day trial opens the complete suite first."
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Pricing', href: '/pricing' },
        ]}
        actions={[
          { label: 'Start 14-day trial', href: '/auth/register' },
          { label: 'Talk to the team', href: '/contact', variant: 'secondary' },
        ]}
        aside={
          <div className="rounded-[1.75rem] border border-purple-100 bg-white p-6 shadow-xl shadow-purple-950/5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">At a glance</p>
            <div className="mt-5 space-y-4">
              {[
                ['AINOS One', `₹${ONE_PRICE.toLocaleString('en-IN')}`, 'per month'],
                ['Individual app', `from ₹${APP_PRICE.toLocaleString('en-IN')}`, 'per app / month'],
                ['AI Studio', `₹${AI_STUDIO_PRICE.toLocaleString('en-IN')}`, 'per month'],
              ].map(([label, price, period]) => (
                <div key={label} className="flex items-end justify-between gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-950">{label}</p>
                    <p className="text-xs text-gray-500">{period}</p>
                  </div>
                  <p className="text-xl font-bold tracking-tight text-[#4c1d95]">{price}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-start gap-2 rounded-xl bg-purple-50/70 px-4 py-3 text-xs leading-relaxed text-purple-900">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              Prices are shown in INR per month. Start with a {TRIAL_DAYS}-day trial, then continue on the plan that fits.
            </div>
          </div>
        }
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          <article className="flex flex-col rounded-[1.75rem] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 ring-1 ring-purple-100">
              <Briefcase className="h-5 w-5 text-[#5b21b6]" />
            </span>
            <p className="mt-5 text-sm font-semibold text-gray-500">Individual apps</p>
            <h2 className="mt-1 text-[21px] font-semibold tracking-tight text-gray-950">Only what you need</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Choose the apps your team will actually use. Add another app when a new workflow becomes worth connecting.
            </p>
            <div className="mt-6">
              <span className="text-4xl font-bold tracking-tight text-gray-950">₹{APP_PRICE.toLocaleString('en-IN')}</span>
              <span className="ml-1 text-sm text-gray-500">/ app / month</span>
            </div>
            <ul className="mt-6 space-y-2.5 text-sm text-gray-600">
              {INDIVIDUAL_APPS.map((app) => (
                <li key={app.name} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <span>
                    <span className="font-medium text-gray-900">{app.name}</span> — {app.description}
                  </span>
                </li>
              ))}
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <span>
                  <span className="font-medium text-gray-900">AI Studio</span> — ₹{AI_STUDIO_PRICE.toLocaleString('en-IN')} /
                  month
                </span>
              </li>
            </ul>
            <Link
              href="/billing"
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-800 transition-colors hover:border-purple-200 hover:bg-purple-50"
            >
              Choose apps <ArrowRight className="h-4 w-4" />
            </Link>
          </article>

          <article className="relative flex flex-col rounded-[1.75rem] border-2 border-white/20 ainos-surface p-6 text-white shadow-2xl shadow-purple-950/20 sm:p-8 lg:-mt-4">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#4c1d95] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
              Full suite
            </span>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <LayoutGrid className="h-5 w-5 text-purple-200" />
            </span>
            <p className="mt-5 text-sm font-semibold text-purple-200">AINOS One</p>
            <h2 className="mt-1 text-[21px] font-semibold tracking-tight">The complete business OS</h2>
            <p className="mt-3 text-sm leading-relaxed text-purple-200/80">
              Every app and AI Studio in one workspace, with one login and one connected set of business records.
            </p>
            <div className="mt-6">
              <span className="text-4xl font-bold tracking-tight">₹{ONE_PRICE.toLocaleString('en-IN')}</span>
              <span className="ml-1 text-sm text-purple-200/80">/ month</span>
            </div>
            <ul className="mt-6 space-y-2.5 text-sm text-purple-100/90">
              {[
                'All eight business apps',
                'AI Studio and AI assistant tools',
                'One customer, product and invoice record',
                'Role-based team access',
                'Shared reporting across departments',
                `${TRIAL_DAYS}-day trial for new companies`,
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/auth/register"
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#4c1d95] transition-colors hover:bg-purple-50"
            >
              Start {TRIAL_DAYS}-day trial <ArrowRight className="h-4 w-4" />
            </Link>
          </article>

          <article className="flex flex-col rounded-[1.75rem] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 ring-1 ring-purple-100">
              <Building2 className="h-5 w-5 text-[#5b21b6]" />
            </span>
            <p className="mt-5 text-sm font-semibold text-gray-500">Custom</p>
            <h2 className="mt-1 text-[21px] font-semibold tracking-tight text-gray-950">For a larger operation</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Map a group, multi-branch structure or custom integration before migration. The team will scope the apps,
              access model and rollout with you.
            </p>
            <div className="mt-6">
              <span className="text-4xl font-bold tracking-tight text-gray-950">Let&apos;s scope it</span>
            </div>
            <ul className="mt-6 space-y-2.5 text-sm text-gray-600">
              {[
                'Multi-branch operations',
                'Custom integrations and API access',
                'Dedicated account management',
                'Migration planning with your team',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="mailto:info.ainosio@gmail.com?subject=AINOS%20custom%20plan"
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-800 transition-colors hover:border-purple-200 hover:bg-purple-50"
            >
              Contact sales <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        </div>
      </section>

      <section className="border-y border-purple-100/70 bg-[#fbfaff] py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Compare"
            title="What changes between the plans."
            description="The apps decide which workflows are available. The workspace stays the same: company-scoped records, team access and one place to work."
          />
          <div className="mt-8 overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  <th scope="col" className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Capability
                  </th>
                  <th scope="col" className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#4c1d95]">
                    AINOS One
                  </th>
                  <th scope="col" className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Individual apps
                  </th>
                  <th scope="col" className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Custom
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {COMPARISON.map((row) => (
                  <tr key={row.feature}>
                    <th scope="row" className="px-5 py-4 text-sm font-medium text-gray-800">
                      {row.feature}
                    </th>
                    <td className="px-5 py-4 text-center">
                      <CellValue value={row.one} />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <CellValue value={row.individual} />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <CellValue value={row.custom} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-gray-500">
            Plan capabilities can change as the product develops. The billing page shows the current selection before
            activation.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <SectionHeading
              eyebrow="Billing"
              title="Choose, review, activate."
              description="No surprise checkout flow. You can see the app selection and total before activation, and change the selection as the team changes."
            />
          </div>
          <div className="lg:col-span-7">
            <ol className="space-y-3">
              {[
                ['01', 'Select the apps or AINOS One', 'Start from the billing workspace and choose the app set that matches the team today.'],
                ['02', 'Review the monthly total', 'The current price for the selection is shown in INR before you confirm.'],
                ['03', 'Activate and invite the team', 'Once active, invite the people who need access and assign the right roles.'],
              ].map(([step, title, description]) => (
                <li key={step} className="flex gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-50 text-xs font-bold text-[#5b21b6]">
                    {step}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-gray-950">{title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-gray-50/60 py-12 sm:py-14">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-12 lg:gap-12 px-4 sm:px-6 lg:px-8">
          <div className="lg:col-span-4">
            <SectionHeading
              eyebrow="Pricing questions"
              title="The details teams ask before switching."
              description="Choosing between individual apps and the full suite? These cover the usual path."
            />
            <Link href="/faq" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#5b21b6]">
              Read all FAQs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="lg:col-span-8">
            <FaqList items={PRICING_FAQS} />
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="Start with the full picture"
        title="Use the trial to test the connected workflow."
        description="A 14-day trial gives the team the full app set, so the decision rests on how the connected workflow feels."
        actions={[
          { label: 'Start 14-day trial', href: '/auth/register' },
          { label: 'Ask a question', href: '/contact', variant: 'secondary' },
        ]}
      />
    </>
  );
}
