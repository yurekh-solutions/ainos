import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  Check,
  LifeBuoy,
  Mail,
  MapPin,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { pageMetadata, absoluteUrl, SITE_URL } from '@/lib/seo';
import { COMPANY } from '@/lib/site-content';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';
import { CtaBand, PageHero, SectionHeading } from '@/components/marketing/PageHero';

export const metadata: Metadata = pageMetadata({
  title: 'Contact AINOS — Sales, Support, Company',
  description:
    'Contact the AINOS team for a product walkthrough, account support or a security and data request. AINOS is operated by Yurekh Solutions in Mumbai.',
  path: '/contact',
  keywords: ['contact AINOS', 'AINOS support', 'Yurekh Solutions contact', 'business software demo India'],
});

const CHANNELS = [
  {
    icon: Users,
    title: 'Product and sales',
    description:
      'For a walkthrough, plan comparison or help mapping AINOS to a team structure. Include the business type and the workflows you want to connect.',
    subject: 'AINOS product walkthrough',
    cta: 'Email the product team',
  },
  {
    icon: LifeBuoy,
    title: 'Existing account support',
    description:
      'For a screen that is not behaving as expected, a billing question or help with your workspace. Include your company name and the affected area.',
    subject: 'AINOS account support',
    cta: 'Email support',
  },
  {
    icon: ShieldCheck,
    title: 'Security and data',
    description:
      'For a security questionnaire, data-processing question or responsible disclosure. Describe the scope and the safest way to share sensitive detail.',
    subject: 'AINOS security request',
    cta: 'Email the security contact',
  },
];

const CHECKLIST = [
  'The company or workspace name',
  'The page or workflow involved',
  'What you expected to happen',
  'What happened instead',
  'A screenshot or example where possible',
];

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: 'Contact AINOS',
          description:
            'Contact AINOS for product questions, account support, security and data requests. Operated by Yurekh Solutions in Mumbai, India.',
          url: absoluteUrl('/contact'),
          inLanguage: 'en-IN',
          mainEntity: {
            '@type': 'Organization',
            '@id': `${SITE_URL}/#organization`,
            name: COMPANY.name,
            legalName: COMPANY.legalName,
            email: COMPANY.email,
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Mumbai',
              addressRegion: 'Maharashtra',
              addressCountry: 'IN',
            },
            contactPoint: [
              {
                '@type': 'ContactPoint',
                contactType: 'sales',
                email: COMPANY.email,
                areaServed: 'IN',
                availableLanguage: ['en', 'hi'],
              },
              {
                '@type': 'ContactPoint',
                contactType: 'customer support',
                email: COMPANY.email,
                areaServed: 'IN',
                availableLanguage: ['en', 'hi'],
              },
            ],
          },
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: absoluteUrl('/') },
          { name: 'Contact', url: absoluteUrl('/contact') },
        ])}
      />

      <PageHero
        eyebrow="Contact"
        title="Talk to the people who build and run AINOS."
        description="Evaluating the platform, running a workspace, or questioning how your data is handled: each has a direct email route."
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Contact', href: '/contact' },
        ]}
        actions={[
          { label: 'Email the team', href: `mailto:${COMPANY.email}` },
          { label: 'Read the FAQ', href: '/faq', variant: 'secondary' },
        ]}
        aside={
          <div className="rounded-[1.75rem] border border-purple-100 bg-white p-6 shadow-xl shadow-purple-950/5 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 ring-1 ring-purple-100">
                <Mail className="h-5 w-5 text-[#5b21b6]" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">Direct email</p>
                <a href={`mailto:${COMPANY.email}`} className="text-sm font-semibold text-gray-950 hover:text-[#5b21b6]">
                  {COMPANY.email}
                </a>
              </div>
            </div>
            <div className="mt-6 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5b21b6]" />
                <div>
                  <p className="font-medium text-gray-900">{COMPANY.legalName}</p>
                  <p className="mt-0.5 text-xs text-gray-500">Operator of AINOS</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#5b21b6]" />
                <div>
                  <p className="font-medium text-gray-900">{COMPANY.location}</p>
                  <p className="mt-0.5 text-xs text-gray-500">Product and support base</p>
                </div>
              </div>
            </div>
            <div className="mt-6 rounded-xl bg-purple-50/70 px-4 py-3 text-xs leading-relaxed text-purple-900">
              Email is the most reliable way to reach the team with a complete record of the issue.
            </div>
          </div>
        }
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <SectionHeading
          eyebrow="Choose the right route"
          title="A useful first email gets a faster answer."
          description="The team handles product, account and security questions from one inbox. The subject line decides who answers."
        />
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {CHANNELS.map((channel) => (
            <article key={channel.title} className="flex flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 ring-1 ring-purple-100">
                <channel.icon className="h-5 w-5 text-[#5b21b6]" />
              </span>
              <h2 className="mt-5 text-lg font-semibold text-gray-950">{channel.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">{channel.description}</p>
              <a
                href={`mailto:${COMPANY.email}?subject=${encodeURIComponent(channel.subject)}`}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#5b21b6] hover:text-[#4c1d95]"
              >
                {channel.cta} <ArrowRight className="h-4 w-4" />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-purple-100/70 bg-[#fbfaff] py-12 sm:py-14">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-12 lg:gap-12 px-4 sm:px-6 lg:px-8">
          <div className="lg:col-span-5">
            <SectionHeading
              eyebrow="Before you send"
              title="Include the details that make the issue reproducible."
              description="A short, complete email is more useful than a long thread that starts with 'it is not working'."
            />
            <div className="mt-7 rounded-2xl border border-purple-100 bg-white p-5 text-sm text-gray-600">
              <p className="font-semibold text-gray-950">Already have an account?</p>
              <p className="mt-2 leading-relaxed">
                Sign in first so you can check the current state of the record, invoice or workspace setting before
                reporting it.
              </p>
              <Link href="/auth/signin" className="mt-4 inline-flex items-center gap-1.5 font-semibold text-[#5b21b6]">
                Sign in to AINOS <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="lg:col-span-7">
            <ul className="space-y-3">
              {CHECKLIST.map((item, index) => (
                <li key={item} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-50 text-[11px] font-bold text-purple-700">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 shrink-0 text-green-600" /> {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="Prefer to explore first?"
        title="Open the product before the conversation."
        description="The feature directory explains every suite and tool. The pricing page shows what each plan includes. The FAQ covers the common questions in between."
        actions={[
          { label: 'Browse features', href: '/features' },
          { label: 'See pricing', href: '/pricing', variant: 'secondary' },
        ]}
      />
    </>
  );
}
