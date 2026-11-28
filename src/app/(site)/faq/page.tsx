import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, LifeBuoy, ReceiptText, ShieldCheck } from 'lucide-react';
import { pageMetadata, absoluteUrl } from '@/lib/seo';
import { ALL_FAQS, FAQ_CATEGORIES } from '@/lib/faqs';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';
import { CtaBand, FaqList, PageHero } from '@/components/marketing/PageHero';

export const metadata: Metadata = pageMetadata({
  title: 'AINOS FAQ — GST, Pricing, Data, Setup',
  description:
    'Direct answers about AINOS: GST billing, Tally imports, individual apps, AINOS One pricing, trials, data ownership, access control and support.',
  path: '/faq',
  keywords: ['AINOS FAQ', 'GST billing questions', 'business suite help', 'AINOS pricing questions'],
});

export default function FaqPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: ALL_FAQS.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: absoluteUrl('/') },
          { name: 'FAQ', url: absoluteUrl('/faq') },
        ])}
      />

      <PageHero
        eyebrow="Frequently asked questions"
        title="Questions, answered without the runaround."
        description="What AINOS includes, how GST and Tally fit, where data lives, and what changes as the team grows."
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'FAQ', href: '/faq' },
        ]}
        actions={[
          { label: 'Explore features', href: '/features' },
          { label: 'See pricing', href: '/pricing', variant: 'secondary' },
        ]}
        aside={
          <div className="rounded-[1.75rem] border border-purple-100 bg-white p-6 shadow-xl shadow-purple-950/5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">Quick answers</p>
            <div className="mt-5 space-y-4">
              {[
                {
                  icon: ReceiptText,
                  title: 'GST-native billing',
                  description: 'CGST, SGST, IGST, HSN and SAC are part of the invoice flow.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Company-scoped access',
                  description: 'Role-based access keeps each team member within the right records.',
                },
                {
                  icon: LifeBuoy,
                  title: 'A real inbox',
                  description: 'Questions reach the team at info.ainosio@gmail.com.',
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50">
                    <item.icon className="h-4 w-4 text-[#5b21b6]" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-950">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/contact"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#5b21b6] hover:text-[#4c1d95]"
            >
              Ask something else <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        }
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-purple-700">
                <BookOpen className="h-4 w-4" /> On this page
              </div>
              <nav aria-label="FAQ categories" className="mt-4 space-y-1.5">
                {FAQ_CATEGORIES.map((category) => (
                  <a
                    key={category.id}
                    href={`#${category.id}`}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-gray-600 transition-colors hover:bg-purple-50 hover:text-[#4c1d95]"
                  >
                    <span>{category.title}</span>
                    <span className="text-xs text-gray-400">{category.items.length}</span>
                  </a>
                ))}
              </nav>
              <div className="mt-6 rounded-2xl ainos-surface p-5 text-white">
                <p className="text-sm font-semibold">Need a human answer?</p>
                <p className="mt-1.5 text-xs leading-relaxed text-purple-200/80">
                  Send the question with your business context and the team will reply by email.
                </p>
                <Link
                  href="/contact"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300 hover:text-white"
                >
                  Contact AINOS <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </aside>

          <div className="space-y-8 lg:col-span-8">
            {FAQ_CATEGORIES.map((category, categoryIndex) => (
              <section key={category.id} id={category.id} className="scroll-mt-24">
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b21b6]">
                    {String(categoryIndex + 1).padStart(2, '0')}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950">{category.title}</h2>
                  <p className="mt-2 text-sm text-gray-500">{category.intro}</p>
                </div>
                <FaqList
                  items={category.items}
                  startIndex={FAQ_CATEGORIES.slice(0, categoryIndex).reduce((total, item) => total + item.items.length, 0)}
                />
              </section>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="From answer to action"
        title="See the connected workflow for yourself."
        description="A 14-day AINOS One trial gives the team the full app set, so the next question can be answered by using the platform rather than reading about it."
        actions={[
          { label: 'Start 14-day trial', href: '/auth/register' },
          { label: 'Compare plans', href: '/pricing', variant: 'secondary' },
        ]}
      />
    </>
  );
}
