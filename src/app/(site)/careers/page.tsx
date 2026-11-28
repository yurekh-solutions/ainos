import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Code2, Compass, HeartHandshake, LifeBuoy, Mail, PenTool, ScrollText } from 'lucide-react';
import { pageMetadata, absoluteUrl } from '@/lib/seo';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';
import { CtaBand, PageHero, SectionHeading } from '@/components/marketing/PageHero';
import { COMPANY } from '@/lib/site-content';

export const metadata: Metadata = pageMetadata({
  title: 'Careers — Work on AINOS at Yurekh Solutions',
  description:
    'AINOS is built by a small team in Mumbai. See how we work, the role families we hire for, and how to send a profile for engineering, design, or implementation.',
  path: '/careers',
  keywords: ['AINOS careers', 'Yurekh Solutions jobs', 'SaaS jobs Mumbai', 'startup jobs India'],
});

const PRINCIPLES = [
  {
    icon: Compass,
    title: 'Ship the workflow, not the feature list',
    body: 'Work is judged by whether a business can finish a real task faster, not by how many screens were added this month.',
  },
  {
    icon: ScrollText,
    title: 'Write down what the system does',
    body: 'Product decisions live in writing so support, sales and engineering describe the same behaviour to customers.',
  },
  {
    icon: HeartHandshake,
    title: 'Customers talk to the people who build it',
    body: 'Engineers and designers sit in on support conversations. The person who can fix the problem hears it first.',
  },
  {
    icon: LifeBuoy,
    title: 'Boring reliability over clever demos',
    body: 'Billing, tax numbers and payroll dates cannot be approximately right. Correctness is treated as a feature with tests.',
  },
];

const ROLE_FAMILIES = [
  {
    icon: Code2,
    title: 'Product engineering',
    body: 'Full-stack work across Next.js, TypeScript and MySQL: GST invoicing, inventory, payroll and the API layer behind the mobile app.',
    detail: 'You will own a module end to end, including its data model and the reports built on top of it.',
  },
  {
    icon: PenTool,
    title: 'Product design',
    body: 'Dashboards that a shop owner, an accountant and a plant supervisor can each use without training.',
    detail: 'You will work from real support transcripts, not abstract personas.',
  },
  {
    icon: LifeBuoy,
    title: 'Implementation and support',
    body: 'Onboarding businesses, importing Tally and Excel data, and turning recurring questions into documentation or product fixes.',
    detail: 'You will be the reason a rollout reaches its second month.',
  },
];

const PROCESS = [
  {
    title: 'Send a short note',
    body: 'Write to the email below with what you have built, the part of AINOS you would want to work on, and a link to code, writing or design work.',
  },
  {
    title: 'A conversation about the product',
    body: 'We talk through a real AINOS workflow and where you think it fails. There is no puzzle round.',
  },
  {
    title: 'A paid, scoped exercise',
    body: 'A small piece of the actual backlog, scoped to a few hours, with the same review standards as production work.',
  },
  {
    title: 'A decision with reasons',
    body: 'Whatever the outcome, you get a written explanation of the decision and what would change it.',
  },
];

export default function CareersPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': `${absoluteUrl('/careers')}#webpage`,
          name: 'Careers at AINOS',
          description:
            'How the AINOS team at Yurekh Solutions works, the role families it hires for, and the hiring process.',
          url: absoluteUrl('/careers'),
          inLanguage: 'en-IN',
          about: { '@id': `${absoluteUrl('/')}#organization` },
          isPartOf: { '@id': `${absoluteUrl('/')}#website` },
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: absoluteUrl('/') },
          { name: 'Careers', url: absoluteUrl('/careers') },
        ])}
      />

      <PageHero
        eyebrow="Careers"
        title="Build the system a business runs on, not another dashboard."
        description="AINOS is built by a small team in Mumbai. Every module touches money, tax or payroll for a real company, which sets the standard."
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Careers', href: '/careers' },
        ]}
        actions={[
          { label: 'Email your profile', href: `mailto:${COMPANY.email}?subject=AINOS%20careers` },
          { label: 'About AINOS', href: '/about', variant: 'secondary' },
        ]}
        aside={
          <div className="rounded-[1.75rem] border border-purple-100 bg-white p-6 shadow-xl shadow-purple-950/5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">How to apply</p>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">
              We do not run a keyword-filtered application portal. Write to the team directly and describe the work you want
              to do.
            </p>
            <a
              href={`mailto:${COMPANY.email}?subject=AINOS%20careers`}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#4c1d95] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3b0f78]"
            >
              <Mail className="h-4 w-4" />
              {COMPANY.email}
            </a>
            <ul className="mt-6 space-y-3 text-xs leading-relaxed text-gray-500">
              <li>Include the module or problem area you care about.</li>
              <li>Link code, writing or design work you are proud of.</li>
              <li>Tell us your notice period and location.</li>
            </ul>
            <div className="mt-6 rounded-xl ainos-surface px-4 py-3 text-xs leading-relaxed text-purple-100/85">
              {COMPANY.legalName} · {COMPANY.location}
            </div>
          </div>
        }
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <SectionHeading
          eyebrow="The team"
          title="A small team with unusually high standards."
          description="Four habits decide how work is done here. They apply to an invoice screen as much as to the payroll run."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {PRINCIPLES.map((item) => (
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
      </section>

      <section className="border-y border-purple-100/70 bg-[#fbfaff] py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Where we hire"
            title="Three role families, one shared product."
            description="Roles are grouped by the kind of work, not by seniority. If your experience crosses two of these, say so in your note."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {ROLE_FAMILIES.map((role) => (
              <article key={role.title} className="flex flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 ring-1 ring-purple-100">
                  <role.icon className="h-5 w-5 text-[#5b21b6]" />
                </span>
                <h3 className="mt-5 text-base font-semibold text-gray-950">{role.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{role.body}</p>
                <p className="mt-3 border-t border-gray-100 pt-3 text-sm leading-relaxed text-gray-500">{role.detail}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 text-sm leading-relaxed text-gray-500">
            Current openings are not listed publicly. Applications are reviewed as roles open, so a note sent today is read
            when the team is hiring for it.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <SectionHeading
              eyebrow="Hiring process"
              title="Four steps, no take-home mystery."
              description="The process shows what the job is actually like, including the parts that are not glamorous."
            />
            <Link
              href="/about"
              className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-[#5b21b6] transition-colors hover:text-[#4c1d95]"
            >
              Read about the company <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="lg:col-span-7">
            <ol className="space-y-3">
              {PROCESS.map((step, index) => (
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
        eyebrow="Start a conversation"
        title="Tell us which part of AINOS you would fix first."
        description="A short note with one concrete opinion about the product is more useful than a formatted resume. Send it to the team inbox."
        actions={[
          { label: 'Email the team', href: `mailto:${COMPANY.email}?subject=AINOS%20careers` },
          { label: 'See what we build', href: '/features', variant: 'secondary' },
        ]}
      />
    </>
  );
}
