import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import SiteFooter from '@/components/SiteFooter';

export const LEGAL_CONTACT_EMAIL = 'info.ainosio@gmail.com';
export const LEGAL_EFFECTIVE_DATE = '20 November 2026';

export interface LegalSection {
  id: string;
  title: string;
  content: ReactNode;
}

/** Shared shell for the public legal pages: brand bar, contents list, numbered sections and cross-links. */
export function LegalPage({
  title,
  intro,
  sections,
  related,
}: {
  title: string;
  intro: ReactNode;
  sections: LegalSection[];
  related: { href: string; label: string };
}) {
  return (
    <div className="min-h-screen bg-[#f8f7fc] overflow-x-hidden">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 min-w-0" aria-label="AINOS home">
            <span className="w-9 h-9 rounded-full bg-violet-50 ring-1 ring-violet-100 flex items-center justify-center shrink-0">
              <Image src="/ainos-alpha.png" alt="" width={20} height={19} className="w-5 h-auto" priority />
            </span>
            <span className="text-lg font-bold text-gray-900">AINOS</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2 text-sm shrink-0">
            <Link href={related.href} className="px-2 py-2 text-gray-600 hover:text-violet-700 whitespace-nowrap">
              {related.label}
            </Link>
            <Link href="/auth/signin" className="px-2 py-2 text-gray-600 hover:text-violet-700 whitespace-nowrap">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-2">Effective date and last updated: {LEGAL_EFFECTIVE_DATE}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-10">
          <div className="text-sm sm:text-[15px] text-gray-700 leading-7 space-y-3 break-words">{intro}</div>

          <nav aria-label="Contents" className="mt-8 rounded-xl bg-violet-50/60 ring-1 ring-violet-100 p-4 sm:p-5">
            <p className="text-sm font-semibold text-gray-900 mb-3">Contents</p>
            <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              {sections.map((s, i) => (
                <li key={s.id} className="min-w-0">
                  <a href={`#${s.id}`} className="flex gap-2 py-0.5 text-violet-800 hover:underline">
                    <span className="shrink-0 tabular-nums">{i + 1}.</span>
                    <span>{s.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-10 space-y-10">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
                  {i + 1}. {s.title}
                </h2>
                <div className="text-sm sm:text-[15px] text-gray-700 leading-7 break-words space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ul]:marker:text-violet-500 [&_strong]:text-gray-900 [&_a]:text-violet-700 [&_a]:underline">
                  {s.content}
                </div>
              </section>
            ))}
          </div>
        </div>

      </main>

      <SiteFooter />
    </div>
  );
}
