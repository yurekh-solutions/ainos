import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Briefcase, Calculator, GraduationCap, Handshake, Mail, Rocket, ShieldCheck } from 'lucide-react';
import { pageMetadata, absoluteUrl } from '@/lib/seo';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';
import { CtaBand, PageHero, SectionHeading } from '@/components/marketing/PageHero';
import { COMPANY } from '@/lib/site-content';

export const metadata: Metadata = pageMetadata({
  title: 'Partner Programme — CA Firms and Agencies',
  description:
    'Work with AINOS as an accounting firm, agency or implementation partner. Get a demo workspace, onboarding playbook and a direct line to the team that builds it.',
  path: '/partners',
  keywords: ['AINOS partner program', 'accounting software partner India', 'SaaS reseller India', 'ERP implementation partner'],
});

const PARTNER_TYPES = [
  {
    icon: Calculator,
    title: 'CA and accounting firms',
    body: 'Move clients off scattered spreadsheets and into one workspace you can audit. Invoices, ledgers and GST reports stay in the same company record.',
    give: 'Client data import from Tally and Excel, day book and GST-ready reports, and a company-scoped login for your team.',
  },
  {
    icon: Briefcase,
    title: 'Agencies and consultants',
    body: 'Run your own delivery on AINOS and recommend the same workspace to clients instead of maintaining a separate stack for each engagement.',
    give: 'CRM, projects, quotations and GST invoices for your own firm, plus a workspace to demonstrate on client calls.',
  },
  {
    icon: Rocket,
    title: 'Implementation and regional partners',
    body: 'Handle onboarding, data migration and first-line support for businesses in your region while the product team handles the platform.',
    give: 'An onboarding playbook, a demo workspace and a direct channel to the team for escalations.',
  },
];

const PROGRAMME = [
  {
    icon: GraduationCap,
    title: 'A demo workspace',
    body: 'A sandbox company with sample GST invoices, products and purchase orders so a client conversation is a walkthrough rather than a slide.',
  },
  {
    icon: ShieldCheck,
    title: 'Onboarding playbook',
    body: 'The same import order and verification steps used for direct customers: company profile, customers, products, opening stock, then opening balances.',
  },
  {
    icon: Handshake,
    title: 'Co-selling support',
    body: 'A product person joins the calls where technical questions decide the deal, and pricing questions are answered from the same published pricing page.',
  },
  {
    icon: Mail,
    title: 'A direct channel',
    body: 'A named contact for partner escalations, so a client-blocking issue does not wait behind a general support queue.',
  },
];

const STEPS = [
  {
    title: 'Intro call',
    body: 'We look at the clients you already serve and decide whether AINOS removes a workflow they are paying someone to do manually.',
  },
  {
    title: 'One pilot client',
    body: 'Run a single client through onboarding with the playbook. Measure the handoff that disappeared, not the number of apps enabled.',
  },
  {
    title: 'Written terms',
    body: 'If the pilot works, terms are agreed in writing for your engagement type. Referral, resale and implementation arrangements differ, so no single rate card is published.',
  },
];

export default function PartnersPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': `${absoluteUrl('/partners')}#webpage`,
          name: 'AINOS partner programme',
          description:
            'Partner arrangements for CA firms, agencies, implementation and regional partners working with AINOS.',
          url: absoluteUrl('/partners'),
          inLanguage: 'en-IN',
          about: { '@id': `${absoluteUrl('/')}#organization` },
          isPartOf: { '@id': `${absoluteUrl('/')}#website` },
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: absoluteUrl('/') },
          { name: 'Partners', url: absoluteUrl('/partners') },
        ])}
      />

      <PageHero
        eyebrow="Partners"
        title="Put your clients on one workspace, not five tools."
        description="AINOS works with firms that already manage another business's books, projects or systems. Their clients stop paying for manual coordination."
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Partners', href: '/partners' },
        ]}
        actions={[
          { label: 'Start a partner conversation', href: `mailto:${COMPANY.email}?subject=AINOS%20partnership` },
          { label: 'Book a walkthrough', href: '/demo', variant: 'secondary' },
        ]}
        aside={
          <div className="rounded-[1.75rem] border border-purple-100 bg-white p-6 shadow-xl shadow-purple-950/5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">Who this is for</p>
            <ul className="mt-5 space-y-4 text-sm leading-relaxed text-gray-600">
              <li className="flex gap-3">
                <Calculator className="mt-0.5 h-4 w-4 shrink-0 text-[#5b21b6]" />
                Accounting and tax practices with clients on spreadsheets or legacy billing software.
              </li>
              <li className="flex gap-3">
                <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-[#5b21b6]" />
                Agencies and consultancies that want delivery and billing in one place.
              </li>
              <li className="flex gap-3">
                <Rocket className="mt-0.5 h-4 w-4 shrink-0 text-[#5b21b6]" />
                Implementation teams who already handle migrations for local businesses.
              </li>
            </ul>
            <a
              href={`mailto:${COMPANY.email}?subject=AINOS%20partnership`}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#4c1d95] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3b0f78]"
            >
              <Mail className="h-4 w-4" />
              {COMPANY.email}
            </a>
            <div className="mt-6 rounded-xl ainos-surface px-4 py-3 text-xs leading-relaxed text-purple-100/85">
              {COMPANY.legalName} · {COMPANY.location}
            </div>
          </div>
        }
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <SectionHeading
          eyebrow="Partner types"
          title="Three ways to work with us."
          description="Most partnerships start with a single client and grow from there. Nothing here requires a volume commitment before the first result."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PARTNER_TYPES.map((type) => (
            <article key={type.title} className="flex flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 ring-1 ring-purple-100">
                <type.icon className="h-5 w-5 text-[#5b21b6]" />
              </span>
              <h3 className="mt-5 text-base font-semibold text-gray-950">{type.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{type.body}</p>
              <div className="mt-5 rounded-2xl bg-[#fbfaff] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-purple-700">What you work with</p>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{type.give}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-purple-100/70 bg-[#fbfaff] py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="What is included"
            title="Support that assumes you are selling a real product."
            description="A partner programme is only useful if it shortens the path from first call to a working workspace."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {PROGRAMME.map((item) => (
              <div key={item.title} className="flex gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-50 ring-1 ring-purple-100">
                  <item.icon className="h-5 w-5 text-[#5b21b6]" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-gray-950">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <SectionHeading
              eyebrow="How it starts"
              title="One pilot before any agreement."
              description="The first conversation is about one client's workflow, not about territory or quotas."
            />
            <Link
              href="/pricing"
              className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-[#5b21b6] transition-colors hover:text-[#4c1d95]"
            >
              See the published pricing <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="lg:col-span-7">
            <ol className="space-y-3">
              {STEPS.map((step, index) => (
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

      <CtaBand
        eyebrow="Partner with AINOS"
        title="Bring one client, test one workflow."
        description="Tell us which client loses the most time to manual coordination. That answers the partnership question faster than a deck."
        actions={[
          { label: 'Email the team', href: `mailto:${COMPANY.email}?subject=AINOS%20partnership` },
          { label: 'Explore the product', href: '/features', variant: 'secondary' },
        ]}
      />
    </>
  );
}
