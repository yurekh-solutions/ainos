import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CalendarCheck, ClipboardCheck, ListChecks, Mail, Users } from 'lucide-react';
import { pageMetadata, absoluteUrl } from '@/lib/seo';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';
import { CtaBand, FaqList, PageHero, SectionHeading } from '@/components/marketing/PageHero';
import { COMPANY } from '@/lib/site-content';
import type { FaqItem } from '@/lib/faqs';

export const metadata: Metadata = pageMetadata({
  title: 'Walkthrough — GST Billing, CRM and Payroll',
  description:
    'Book a working walkthrough of AINOS. Bring one real workflow, see it run in a sandbox workspace, and leave with an import plan and a clear price.',
  path: '/demo',
  keywords: ['AINOS demo', 'book software demo India', 'GST billing software demo', 'ERP demo walkthrough'],
});

const AGENDA = [
  {
    title: 'Your current handoff',
    body: 'We start with the process that costs you the most follow-up today: quote to invoice, sale to stock, hire to payroll or order to dispatch.',
  },
  {
    title: 'The same workflow in AINOS',
    body: 'It runs live in a sandbox company that already holds sample customers, products and GST documents, so you see the screens with real-shaped data.',
  },
  {
    title: 'Your data and the import order',
    body: 'We map what you would bring in — customers, products, opening stock, opening balances — and the order it has to happen in.',
  },
  {
    title: 'Price and the first month',
    body: 'You leave knowing which apps are needed, what that costs per month, and what the first week of adoption looks like.',
  },
];

const PREPARE = [
  'One real invoice, with the tax split you actually use.',
  'A sample of your product or service list, in any format.',
  'The tools you use today for billing, stock and accounts.',
  'Who signs off, and the questions they will ask.',
];

const FAQS: FaqItem[] = [
  {
    question: 'What happens in an AINOS walkthrough?',
    answer:
      'One workflow runs end to end in a sandbox company: customer or product record, invoice, payment status and report. It closes with the import order for your data and the monthly price for the apps you need.',
  },
  {
    question: 'Do I need to prepare data before the call?',
    answer:
      'No preparation is required. The walkthrough uses sample data. If you bring one invoice and your current tool list, the session can map your exact setup instead of a generic example.',
  },
  {
    question: 'Can I skip the call and test AINOS on my own?',
    answer:
      'Yes. A 14-day trial starts from the registration page, and the feature pages describe the same workflows. The call earns its place when one process needs checking against your own.',
  },
];

export default function DemoPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': `${absoluteUrl('/demo')}#webpage`,
          name: 'Book an AINOS walkthrough',
          description:
            'What an AINOS walkthrough covers, who should attend, what to prepare, and how to book one.',
          url: absoluteUrl('/demo'),
          inLanguage: 'en-IN',
          about: { '@id': `${absoluteUrl('/')}#software` },
          isPartOf: { '@id': `${absoluteUrl('/')}#website` },
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          '@id': `${absoluteUrl('/demo')}#faq`,
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
          { name: 'Book a walkthrough', url: absoluteUrl('/demo') },
        ])}
      />

      <PageHero
        eyebrow="Walkthrough"
        title="Bring one real workflow. Leave knowing if it fits."
        description="A walkthrough is a working session. We run the process you care about in a sandbox, then say where the platform fits and where it does not."
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Book a walkthrough', href: '/demo' },
        ]}
        actions={[
          { label: 'Email to book a slot', href: `mailto:${COMPANY.email}?subject=AINOS%20walkthrough` },
          { label: 'Start 14-day trial', href: '/auth/register', variant: 'secondary' },
        ]}
        aside={
          <div className="rounded-[1.75rem] border border-purple-100 bg-white p-6 shadow-xl shadow-purple-950/5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">How to book</p>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">
              Write from the email address you want the reply on and include the workflow you want to see. That is enough to
              schedule.
            </p>
            <a
              href={`mailto:${COMPANY.email}?subject=AINOS%20walkthrough`}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#4c1d95] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3b0f78]"
            >
              <Mail className="h-4 w-4" />
              {COMPANY.email}
            </a>
            <ul className="mt-6 space-y-3 text-xs leading-relaxed text-gray-500">
              <li>Company name and the work you do.</li>
              <li>The handoff you want to look at.</li>
              <li>The tools you use today.</li>
              <li>Who else will join the call.</li>
            </ul>
            <div className="mt-6 rounded-xl ainos-surface px-4 py-3 text-xs leading-relaxed text-purple-100/85">
              {COMPANY.legalName} · {COMPANY.location}
            </div>
          </div>
        }
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <SectionHeading
          eyebrow="The agenda"
          title="Four parts, in this order."
          description="The sequence is deliberate: your workflow first, the product second, your data third, the price last."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {AGENDA.map((item, index) => (
            <article key={item.title} className="flex gap-5 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4c1d95] to-[#6d28d9] text-xs font-bold text-white">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="text-base font-semibold text-gray-950">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{item.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-purple-100/70 bg-[#fbfaff] py-12 sm:py-14">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-12 lg:gap-12 px-4 sm:px-6 lg:px-8">
          <div className="lg:col-span-5">
            <SectionHeading
              eyebrow="Bring the right people"
              title="One owner, one operator, one accountant."
              description="Decisions stall when the person who uses the screen is not in the room. Two or three attendees is enough."
            />
            <div className="mt-7 flex items-start gap-3 rounded-2xl border border-purple-100 bg-white p-4 text-sm text-purple-900 shadow-sm">
              <Users className="mt-0.5 h-5 w-5 shrink-0" />
              <p>If the accounts team cannot join, the walkthrough can be repeated for them separately.</p>
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-[#5b21b6]" />
                <h3 className="text-base font-semibold text-gray-950">What to bring</h3>
              </div>
              <ul className="mt-4 space-y-3">
                {PREPARE.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-gray-600">
                    <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#5b21b6]" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-gray-100 pt-5 text-sm leading-relaxed text-gray-500">
                None of this is mandatory. A session with no preparation still shows the product; these four items are what
                make it specific to your business.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <SectionHeading
              eyebrow="Before you book"
              title="Answers to the three questions asked most."
              description="If none of these apply, the trial path is usually faster than a call."
            />
            <div className="mt-7 space-y-2">
              <Link
                href="/pricing"
                className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-sm transition-colors hover:border-purple-200 hover:text-[#4c1d95]"
              >
                See the published pricing
                <ArrowRight className="h-4 w-4 text-gray-300" />
              </Link>
              <Link
                href="/faq"
                className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-sm transition-colors hover:border-purple-200 hover:text-[#4c1d95]"
              >
                Read the full FAQ
                <ArrowRight className="h-4 w-4 text-gray-300" />
              </Link>
              <Link
                href="/industries"
                className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-sm transition-colors hover:border-purple-200 hover:text-[#4c1d95]"
              >
                Find your industry
                <ArrowRight className="h-4 w-4 text-gray-300" />
              </Link>
            </div>
          </div>
          <div className="lg:col-span-8">
            <FaqList items={FAQS} />
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-purple-100 bg-purple-50/60 p-4 text-sm text-purple-900">
              <CalendarCheck className="h-5 w-5 shrink-0" />
              <p>Slots are confirmed over email, so the thread itself holds the date, attendees and agenda.</p>
            </div>
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="See it with your own numbers"
        title="A walkthrough answers the questions a page cannot."
        description="Send the process you want to check. If AINOS is the wrong fit, the first conversation says so rather than a migration."
        actions={[
          { label: 'Email to book a slot', href: `mailto:${COMPANY.email}?subject=AINOS%20walkthrough` },
          { label: 'Start 14-day trial', href: '/auth/register', variant: 'secondary' },
        ]}
      />
    </>
  );
}
