import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Database,
  FileCheck2,
  KeyRound,
  LockKeyhole,
  Mail,
  Server,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { pageMetadata, absoluteUrl } from '@/lib/seo';
import { COMPANY } from '@/lib/site-content';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';
import { CtaBand, PageHero, SectionHeading } from '@/components/marketing/PageHero';

export const metadata: Metadata = pageMetadata({
  title: 'Security and Data Protection — AINOS',
  description:
    'How AINOS approaches access control, HTTPS, company-scoped data, exports, AI review and managed infrastructure. Read the practices behind the platform.',
  path: '/security',
  keywords: ['AINOS security', 'business data protection India', 'role-based access', 'cloud security'],
});

const PRACTICES = [
  {
    icon: KeyRound,
    title: 'Sign-in and access control',
    description:
      'The signed-in workspace is protected by account authentication and role-based access. Company records are scoped to the workspace instead of being publicly addressable.',
  },
  {
    icon: LockKeyhole,
    title: 'Encrypted transport',
    description:
      'Traffic between the browser and AINOS uses HTTPS. Security headers restrict framing, MIME sniffing and other common browser-level risks on public pages.',
  },
  {
    icon: Users,
    title: 'Company-scoped data',
    description:
      'Invoices, customers, products, payroll and campaign records belong to a company workspace. Team access is granted to people inside that workspace.',
  },
  {
    icon: FileCheck2,
    title: 'Records stay exportable',
    description:
      'Business documents can be exported, and finance workflows support Tally-compatible outputs. The platform is designed to avoid trapping operational history.',
  },
  {
    icon: Database,
    title: 'Managed infrastructure',
    description:
      'AINOS uses managed providers for application hosting, database, file storage, email delivery and AI processing. The Privacy Policy names the current vendors and their roles.',
  },
  {
    icon: Server,
    title: 'Operational safeguards',
    description:
      'Database access is limited to application and administrative use, secrets are kept in environment configuration, and production traffic is served over the canonical domain.',
  },
];

const AI_POINTS = [
  'AI tools draft content, extract document fields and summarise information; they do not replace human review before sending or filing.',
  'Generated output can be wrong or incomplete. Review invoices, tax figures, customer communications and published content before use.',
  'AI actions consume credits from the workspace plan, so usage is visible in the billing area.',
  'The Privacy Policy describes the current AI processing providers and how data is handled.',
];

export default function SecurityPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'AINOS security and data protection',
          description:
            'Access control, encrypted transport, company-scoped records, data export, AI review and managed infrastructure practices at AINOS.',
          url: absoluteUrl('/security'),
          inLanguage: 'en-IN',
          about: { '@id': `${absoluteUrl('/')}#organization` },
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: absoluteUrl('/') },
          { name: 'Security', url: absoluteUrl('/security') },
        ])}
      />

      <PageHero
        eyebrow="Security and data"
        title="Security is a product requirement, not a footer link."
        description="The platform holds invoices, customer records and payroll. Access, transport and data ownership are part of how it is built, not a disclaimer."
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Security', href: '/security' },
        ]}
        actions={[
          { label: 'Read the Privacy Policy', href: '/privacy' },
          { label: 'Contact the team', href: '/contact', variant: 'secondary' },
        ]}
        aside={
          <div className="rounded-[1.75rem] border border-purple-100 bg-white p-6 shadow-xl shadow-purple-950/5 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 ring-1 ring-purple-100">
                <ShieldCheck className="h-5 w-5 text-[#5b21b6]" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">At a glance</p>
                <p className="text-sm font-semibold text-gray-950">Controls that apply to every workspace</p>
              </div>
            </div>
            <ul className="mt-5 space-y-3 text-sm text-gray-600">
              {[
                'HTTPS on public and signed-in pages',
                'Role-based, company-scoped access',
                'Export-ready business records',
                'Managed database and file providers',
                'AI output reviewed before use',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-xl bg-purple-50/70 px-4 py-3 text-xs leading-relaxed text-purple-900">
              For a specific security questionnaire, email {COMPANY.email} with the scope of your review.
            </div>
          </div>
        }
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <SectionHeading
          eyebrow="How the platform is protected"
          title="Six controls that shape how business data is handled."
          description="Not an infrastructure inventory. The boundaries a workspace owner needs to understand and test."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRACTICES.map((practice) => (
            <article key={practice.title} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 ring-1 ring-purple-100">
                <practice.icon className="h-5 w-5 text-[#5b21b6]" />
              </span>
              <h2 className="mt-5 text-base font-semibold text-gray-950">{practice.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{practice.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-purple-100/70 bg-[#fbfaff] py-12 sm:py-14">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-12 lg:gap-12 px-4 sm:px-6 lg:px-8">
          <div className="lg:col-span-5">
            <SectionHeading
              eyebrow="AI with review"
              title="AI should remove work, not remove judgement."
              description="AINOS uses AI for drafting, extraction and analysis. The person sending the invoice or publishing the content remains responsible for the final output."
            />
            <div className="mt-7 flex items-start gap-3 rounded-2xl border border-purple-100 bg-white p-4 text-sm text-gray-600">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#5b21b6]" />
              <p>Treat AI output as a first draft. Review names, amounts, tax treatment, links and claims before publishing.</p>
            </div>
          </div>
          <div className="space-y-3 lg:col-span-7">
            {AI_POINTS.map((point, index) => (
              <div key={point} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-50 text-[11px] font-bold text-purple-700">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className="text-sm leading-relaxed text-gray-600">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-8">
            <SectionHeading
              eyebrow="Data ownership"
              title="The business owns its records."
              description="AINOS processes business data to provide the service. Export options and Tally-compatible workflows exist so finance records can move with the business."
            />
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <Link href="/privacy" className="inline-flex items-center gap-1.5 font-semibold text-[#5b21b6] hover:text-[#4c1d95]">
                Privacy Policy <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/terms" className="inline-flex items-center gap-1.5 font-semibold text-[#5b21b6] hover:text-[#4c1d95]">
                Terms and Conditions <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="rounded-3xl ainos-surface p-6 text-white">
              <Mail className="h-6 w-6 text-purple-300" />
              <p className="mt-4 text-base font-semibold">Security or data request</p>
              <p className="mt-2 text-sm leading-relaxed text-purple-200/80">
                Send the scope, workspace and timeline to the team. Include a secure way to share any sensitive detail.
              </p>
              <a
                href={`mailto:${COMPANY.email}?subject=AINOS%20security%20request`}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#4c1d95] hover:bg-purple-50"
              >
                {COMPANY.email} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="A considered rollout"
        title="Evaluate the platform with the controls in view."
        description="Use the trial to test role-based access, document flow and exports with the people who will own the workspace."
        actions={[
          { label: 'Start 14-day trial', href: '/auth/register' },
          { label: 'Ask a security question', href: '/contact', variant: 'secondary' },
        ]}
      />
    </>
  );
}
