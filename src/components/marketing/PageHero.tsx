import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import type { FaqItem } from '@/lib/faqs';

export type MarketingAction = {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary' | 'light';
};

function isInternal(href: string) {
  return href.startsWith('/') && !href.startsWith('//');
}

export function ActionLink({ action, className = '' }: { action: MarketingAction; className?: string }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-colors';
  const tone =
    action.variant === 'secondary'
      ? 'border border-gray-200 bg-white text-gray-800 hover:border-purple-200 hover:bg-purple-50'
      : action.variant === 'light'
        ? 'bg-white text-[#4c1d95] shadow-lg shadow-purple-950/20 hover:bg-purple-50'
        : 'bg-[#4c1d95] text-white shadow-md shadow-purple-900/20 hover:bg-[#3b0f78]';

  if (isInternal(action.href)) {
    return (
      <Link href={action.href} className={`${base} ${tone} ${className}`}>
        {action.label}
        <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <a href={action.href} className={`${base} ${tone} ${className}`}>
      {action.label}
      <ArrowRight className="h-4 w-4" />
    </a>
  );
}

export function Breadcrumbs({ items }: { items: { name: string; href: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <span key={item.href} className="inline-flex items-center gap-1.5">
            {last ? (
              <span aria-current="page" className="font-medium text-gray-700">
                {item.name}
              </span>
            ) : (
              <Link href={item.href} className="transition-colors hover:text-[#4c1d95]">
                {item.name}
              </Link>
            )}
            {!last && <ChevronRight className="h-3 w-3 text-gray-300" />}
          </span>
        );
      })}
    </nav>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  actions = [],
  breadcrumbs,
  aside,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: MarketingAction[];
  breadcrumbs?: { name: string; href: string }[];
  aside?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-purple-100/70 bg-[#fbfaff]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ddd4f2_1px,transparent_1px)] [background-size:25px_25px] [mask-image:radial-gradient(ellipse_72%_70%_at_45%_30%,black,transparent)]" />
      <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-purple-200/45 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 h-80 w-80 rounded-full bg-indigo-100/60 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 pb-12 pt-8 sm:px-6 sm:pb-14 sm:pt-10 lg:grid-cols-12 lg:items-center lg:gap-12 lg:px-8 lg:pb-16 lg:pt-12">
        <div className={aside ? 'lg:col-span-7' : 'lg:col-span-9'}>
          {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
          <span className="inline-flex items-center rounded-full border border-purple-200 bg-white px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5b21b6] shadow-sm">
            {eyebrow}
          </span>
          <h1 className="mt-5 max-w-4xl text-balance text-[27px] font-semibold leading-[1.22] tracking-tight text-gray-950 sm:text-[31px] md:text-[34px] lg:text-[36px]">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">{description}</p>
          {actions.length > 0 && (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {actions.map((action) => (
                <ActionLink key={`${action.label}-${action.href}`} action={action} />
              ))}
            </div>
          )}
        </div>
        {aside && <div className="min-w-0 lg:col-span-5">{aside}</div>}
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5b21b6]">{eyebrow}</p>
      )}
      <h2 className="mt-3 text-balance text-[25px] font-semibold leading-[1.24] tracking-tight text-gray-950 sm:text-[30px]">{title}</h2>
      {description && <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">{description}</p>}
    </div>
  );
}

export function CtaBand({
  eyebrow = 'Run the business from one place',
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions: MarketingAction[];
}) {
  return (
    <section className="py-12 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] ainos-surface px-6 py-10 shadow-2xl shadow-purple-950/25 sm:px-10 sm:py-12 lg:px-14">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-purple-300/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.13)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_65%_90%_at_60%_40%,black,transparent)]" />
          <div className="relative max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-200">{eyebrow}</p>
            <h2 className="mt-3 text-balance text-[26px] font-semibold leading-[1.22] tracking-tight text-white sm:text-[30px] md:text-[33px] lg:text-[35px]">
              {title}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-purple-100 sm:text-lg">{description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {actions.map((action) => (
                <ActionLink
                  key={`${action.label}-${action.href}`}
                  action={{ ...action, variant: action.variant ?? 'light' }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FaqList({ items, startIndex = 0 }: { items: FaqItem[]; startIndex?: number }) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <details
          key={item.question}
          className="group rounded-2xl border border-gray-100 bg-white shadow-sm transition-colors open:border-purple-200 open:shadow-md"
        >
          <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-5 text-left sm:px-6 [&::-webkit-details-marker]:hidden">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-50 text-[11px] font-bold text-purple-700 group-open:bg-[#4c1d95] group-open:text-white">
              {String(startIndex + index + 1).padStart(2, '0')}
            </span>
            <span className="flex-1 text-sm font-semibold leading-snug text-gray-900 group-open:text-[#4c1d95] sm:text-base">
              {item.question}
            </span>
            <ChevronDown className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180 group-open:text-[#4c1d95]" />
          </summary>
          <div className="px-5 pb-5 pl-[4.25rem] pr-6 sm:px-6 sm:pb-6 sm:pl-[4.5rem]">
            <div className="border-l-2 border-purple-200 pl-4">
              <p className="text-sm leading-relaxed text-gray-600 sm:text-[15px]">{item.answer}</p>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}
