'use client';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search, Calendar, Clock, ArrowRight, BookOpen, Rss, ChevronDown, Compass,
  FileText, Wallet, Users, UserCog, Boxes, Bot, TrendingUp, Megaphone,
  ArrowLeftRight, Bookmark, ListChecks, CheckCircle2,
} from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';
import { START_HERE, BLOG_FAQ, TOPICS, topicFor, topicMeta } from '@/lib/blog-topics';

export interface BlogPost {
  id: string; title: string; slug: string; content: string; excerpt: string | null;
  featuredImage: string | null; category: string | null;
  publishedAt: string | null; tags: string[] | null; createdAt: string;
}

// Topic icons live here so the data file in src/lib stays React-free.
const TOPIC_ICONS: Record<string, typeof FileText> = {
  'GST & Billing': FileText,
  'Finance & Billing': Wallet,
  'CRM & Sales': Users,
  'HR & Payroll': UserCog,
  'Inventory & Stock': Boxes,
  'AI & Automation': Bot,
  'SEO & AEO': TrendingUp,
  'Digital Marketing': Megaphone,
  Migration: ArrowLeftRight,
  'Buying Guides': Bookmark,
};

const TOPIC_ORDER = TOPICS.map((t) => t.label);

// Pinned to IST so the server-rendered date and the hydrated one always agree.
const dateFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
});
const longDateFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata',
});

const readMinutes = (content: string) =>
  Math.max(1, Math.ceil((content || '').trim().split(/\s+/).filter(Boolean).length / 200));

function guideDate(post: BlogPost) {
  return post.publishedAt || post.createdAt;
}

// The list is server-rendered from page.tsx so crawlers and answer engines see every
// guide in the HTML; search, topic and sort run locally on that same list.
export default function BlogListClient({ posts }: { posts: BlogPost[] }) {
  const [q, setQ] = useState('');
  const [activeTopic, setActiveTopic] = useState('All');
  const [sort, setSort] = useState<'latest' | 'quick' | 'az'>('latest');

  const topics = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach((p) => {
      const label = topicFor(p.category);
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    return [...counts.entries()]
      .map(([label, count]) => ({ label, count, meta: topicMeta(label) }))
      .sort((a, b) => {
        const ia = TOPIC_ORDER.indexOf(a.label);
        const ib = TOPIC_ORDER.indexOf(b.label);
        if (ia !== ib) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
        return b.count - a.count;
      });
  }, [posts]);

  const stats = useMemo(() => {
    const minutes = posts.map((p) => readMinutes(p.content));
    const latest = posts.reduce<string>((acc, p) => (guideDate(p) > acc ? guideDate(p) : acc), '');
    return {
      guides: posts.length,
      topics: topics.length,
      avgRead: minutes.length ? Math.round(minutes.reduce((a, b) => a + b, 0) / minutes.length) : 0,
      updated: latest ? dateFmt.format(new Date(latest)) : '',
    };
  }, [posts, topics.length]);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = posts.filter((p) => {
      const matchesTopic = activeTopic === 'All' || topicFor(p.category) === activeTopic;
      const matchesSearch =
        term === '' ||
        `${p.title} ${p.excerpt || ''} ${topicFor(p.category)} ${(p.tags || []).join(' ')}`
          .toLowerCase()
          .includes(term);
      return matchesTopic && matchesSearch;
    });
    if (sort === 'quick') return [...filtered].sort((a, b) => readMinutes(a.content) - readMinutes(b.content));
    if (sort === 'az') return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    return filtered;
  }, [posts, activeTopic, q, sort]);

  const isFiltered = q.trim() !== '' || activeTopic !== 'All';
  const featured = posts[0];
  const grid = isFiltered || sort !== 'latest' ? visible : visible.slice(1);

  const startHere = useMemo(
    () =>
      START_HERE.map((item, i) => {
        const post = posts.find((p) => p.slug === item.slug);
        return post ? { ...item, post, index: i + 1 } : null;
      }).filter(Boolean) as { slug: string; step: string; post: BlogPost; index: number }[],
    [posts]
  );

  const pickTopic = (label: string) => {
    setActiveTopic(label);
    setQ('');
    document.getElementById('guides')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ─── NAV ───────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            <Link href="/blog" className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50 ring-1 ring-violet-100">
                <Image src="/ainos-alpha.png" alt="AINOS" width={20} height={19} className="h-5 w-auto" priority />
              </span>
              <span className="truncate text-lg font-bold text-gray-900">AINOS Blog</span>
            </Link>

            <div className="hidden items-center gap-6 text-sm text-gray-600 md:flex">
              <a href="#topics" className="transition-colors hover:text-[#4c1d95]">Topics</a>
              <a href="#guides" className="transition-colors hover:text-[#4c1d95]">All guides</a>
              <a href="#faq" className="transition-colors hover:text-[#4c1d95]">FAQ</a>
            </div>

            <div className="flex shrink-0 items-center gap-3 sm:gap-4">
              <a
                href="/api/blog-rss"
                title="RSS Feed"
                className="flex items-center gap-1 py-2 text-sm text-gray-600 transition-colors hover:text-[#4c1d95]"
              >
                <Rss className="h-4 w-4" />
                <span className="hidden sm:inline">RSS</span>
              </a>
              <Link
                href="/"
                className="whitespace-nowrap py-2 text-sm text-gray-600 transition-colors hover:text-gray-900"
              >
                <span className="hidden sm:inline">Back to </span>AINOS
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── HERO ──────────────────────────────────────────────── */}
      <header className="border-b border-gray-100 bg-[#f8f7fc]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-purple-700 shadow-sm">
                <BookOpen className="h-3.5 w-3.5" /> AINOS Guides
              </span>
              <h1 className="text-balance text-[27px] font-semibold leading-[1.22] tracking-tight sm:text-[31px] md:text-[34px] lg:text-[36px] text-gray-900">
                Run the business, not the guesswork
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
                {stats.guides} practical guides from the AINOS team on GST billing, collections, CRM,
                payroll, inventory and getting found on Google and AI answers - written for small and
                growing businesses in India.
              </p>

              <div className="relative mt-7 max-w-xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search guides: e-invoice, GSTR-2B, payroll, dead stock..."
                  aria-label="Search guides"
                  className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-12 pr-4 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 sm:grid-cols-4">
                {[
                  { icon: FileText, label: 'Guides', value: String(stats.guides) },
                  { icon: Compass, label: 'Topics', value: String(stats.topics) },
                  { icon: Clock, label: 'Average read', value: `${stats.avgRead} min` },
                  { icon: Calendar, label: 'Last published', value: stats.updated || '-' },
                ].map((s) => (
                  <div key={s.label} className="bg-white px-4 py-3.5">
                    <dt className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                      <s.icon className="h-3.5 w-3.5 text-[#5b21b6]" /> {s.label}
                    </dt>
                    <dd className="mt-1 text-lg font-bold tracking-tight text-gray-900">{s.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-7 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                  Popular
                </span>
                {topics.slice(0, 5).map((t) => (
                  <button
                    key={t.label}
                    onClick={() => pickTopic(t.label)}
                    className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-purple-300 hover:text-[#4c1d95]"
                  >
                    {t.label}
                    <span className="ml-1.5 text-xs text-gray-400">{t.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Start here — the order we would tell a business owner to fix things in */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4c1d95] to-[#6d28d9] text-white shadow-md shadow-purple-900/20">
                    <ListChecks className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Start here</h2>
                    <p className="text-sm text-gray-500">Four guides, in order</p>
                  </div>
                </div>

                <ol className="divide-y divide-gray-100">
                  {startHere.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={`/blog/${item.slug}`}
                        className="group flex items-start gap-4 rounded-xl px-2 py-3.5 transition-colors hover:bg-purple-50/60"
                      >
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-50 text-xs font-bold text-[#4c1d95]">
                          {item.index}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold uppercase tracking-wider text-purple-700/70">
                            {item.step}
                          </span>
                          <span className="mt-1 block text-sm font-semibold leading-snug text-gray-900 group-hover:text-[#4c1d95]">
                            {item.post.title}
                          </span>
                          <span className="mt-1.5 flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" /> {readMinutes(item.post.content)} min
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" /> {dateFmt.format(new Date(guideDate(item.post)))}
                            </span>
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>

                <Link
                  href="/features"
                  className="mt-5 flex items-center gap-1.5 border-t border-gray-100 pt-5 text-sm font-semibold text-[#5b21b6] transition-colors hover:text-[#4c1d95]"
                >
                  See the tools behind these guides <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ─── TOPICS ────────────────────────────────────────────── */}
        <section id="topics" className="scroll-mt-20 py-10 sm:py-12">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">
                <Compass className="h-3.5 w-3.5" /> Browse by topic
              </span>
              <h2 className="text-balance text-[21px] font-semibold tracking-tight text-gray-900 sm:text-[25px]">
                Find the problem first, the guide follows
              </h2>
              <p className="mt-3 text-gray-600">
                Each topic collects the guides that cover it, plus the AINOS screen where that work
                actually gets done.
              </p>
            </div>
            {activeTopic !== 'All' && (
              <button
                onClick={() => setActiveTopic('All')}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-purple-300 hover:text-[#4c1d95]"
              >
                Clear topic
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((t) => {
              const Icon = TOPIC_ICONS[t.label] || BookOpen;
              const active = activeTopic === t.label;
              return (
                <button
                  key={t.label}
                  onClick={() => pickTopic(t.label)}
                  className={`group flex flex-col rounded-2xl border p-5 text-left transition-all ${
                    active
                      ? 'border-purple-300 bg-purple-50/60 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-purple-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        active
                          ? 'bg-gradient-to-br from-[#4c1d95] to-[#6d28d9] text-white'
                          : 'bg-purple-50 text-[#5b21b6] group-hover:bg-purple-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-gray-900">{t.label}</h3>
                      <p className="text-xs text-gray-500">
                        {t.count} {t.count === 1 ? 'guide' : 'guides'}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600">{t.meta.blurb}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#5b21b6]">
                    {t.meta.tool.label}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ─── GUIDES ────────────────────────────────────────────── */}
        <section id="guides" className="scroll-mt-20 border-t border-gray-100 py-10 sm:py-12">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-purple-700 shadow-sm">
                <FileText className="h-3.5 w-3.5" /> The library
              </span>
              <h2 className="text-balance text-[21px] font-semibold tracking-tight text-gray-900 sm:text-[25px]">
                {activeTopic === 'All' ? 'Every guide' : `${activeTopic} guides`}
              </h2>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 p-1">
              {([
                ['latest', 'Latest'],
                ['quick', 'Quick read'],
                ['az', 'A–Z'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSort(key)}
                  aria-pressed={sort === key}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    sort === key ? 'bg-white text-[#4c1d95] shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Topic chips stay available for narrow topics on smaller screens */}
          <div className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {['All', ...topics.map((t) => t.label)].map((label) => (
              <button
                key={label}
                onClick={() => setActiveTopic(label)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  activeTopic === label
                    ? 'bg-[#4c1d95] text-white shadow-sm'
                    : 'border border-gray-200 bg-white text-gray-600 hover:border-purple-300 hover:text-[#4c1d95]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="mb-8 text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-900">{visible.length}</span>{' '}
            {visible.length === 1 ? 'guide' : 'guides'}
            {q.trim() && <> for “{q.trim()}”</>}
            {isFiltered && (
              <button
                onClick={() => { setQ(''); setActiveTopic('All'); }}
                className="ml-3 font-semibold text-[#5b21b6] hover:text-[#4c1d95]"
              >
                Reset
              </button>
            )}
          </p>

          {visible.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center">
              <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p className="text-lg font-semibold text-gray-900">Nothing matches that yet</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
                Try a shorter word - “invoice”, “payroll”, “stock” - or browse the topic cards above.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => { setQ(''); setActiveTopic('All'); }}
                  className="rounded-xl bg-[#4c1d95] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5b21b6]"
                >
                  Show all guides
                </button>
                <Link
                  href="/features"
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-purple-300 hover:text-[#4c1d95]"
                >
                  Explore AINOS
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Latest guide, unfiltered only */}
              {featured && !isFiltered && sort === 'latest' && (
                <Link
                  href={`/blog/${featured.slug}`}
                  className="group mb-8 block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:border-purple-200 hover:shadow-xl"
                >
                  <div className="grid lg:grid-cols-5">
                    <div className="relative min-h-[220px] overflow-hidden bg-gray-100 lg:col-span-3 lg:min-h-[340px]">
                      {featured.featuredImage ? (
                        <img
                          src={featured.featuredImage}
                          alt={featured.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <BookOpen className="h-16 w-16 text-gray-300" />
                        </div>
                      )}
                      <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#4c1d95] shadow-sm">
                        Latest guide
                      </span>
                    </div>
                    <div className="flex flex-col justify-center p-6 sm:p-8 lg:col-span-2">
                      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-purple-50 px-2.5 py-1 font-semibold text-[#4c1d95]">
                          {topicFor(featured.category)}
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock className="h-3.5 w-3.5" /> {readMinutes(featured.content)} min read
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <Calendar className="h-3.5 w-3.5" />
                          {longDateFmt.format(new Date(guideDate(featured)))}
                        </span>
                      </div>
                      <h3 className="text-balance text-xl font-bold text-gray-900 transition-colors group-hover:text-[#4c1d95] sm:text-2xl">
                        {featured.title}
                      </h3>
                      {featured.excerpt && (
                        <p className="mt-3 text-sm leading-relaxed text-gray-600">{featured.excerpt}</p>
                      )}
                      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#5b21b6] group-hover:gap-2.5 transition-all">
                        Read the guide <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              )}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {grid.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-lg"
                  >
                    <div className="aspect-[16/9] overflow-hidden bg-gray-100">
                      {post.featuredImage ? (
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="flex h-full min-h-[160px] items-center justify-center">
                          <BookOpen className="h-10 w-10 text-gray-300" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <div className="mb-2.5 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-purple-50 px-2.5 py-1 font-semibold text-[#4c1d95]">
                          {topicFor(post.category)}
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock className="h-3.5 w-3.5" /> {readMinutes(post.content)} min
                        </span>
                      </div>

                      <h3 className="text-balance font-bold leading-snug text-gray-900 transition-colors group-hover:text-[#4c1d95]">
                        {post.title}
                      </h3>

                      {post.excerpt && (
                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-600">
                          {post.excerpt}
                        </p>
                      )}

                      {post.tags && post.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {dateFmt.format(new Date(guideDate(post)))}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-[#5b21b6]">
                          Read <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>

        {/* ─── FAQ ───────────────────────────────────────────────── */}
        <section id="faq" className="scroll-mt-20 border-t border-gray-100 py-10 sm:py-12">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> About these guides
              </span>
              <h2 className="text-balance text-[21px] font-semibold tracking-tight text-gray-900 sm:text-[25px]">
                What people ask before they read
              </h2>
              <p className="mt-3 text-gray-600">
                No signup wall, no gated chapters. Written by the team that builds the billing, CRM,
                payroll and inventory modules - and you can check every rule against the notification it
                cites.
              </p>
              <a
                href="/api/blog-rss"
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-purple-300 hover:text-[#4c1d95]"
              >
                <Rss className="h-4 w-4 text-[#5b21b6]" /> Subscribe to the feed
              </a>
            </div>

            <div className="lg:col-span-8">
              <div className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                {BLOG_FAQ.map((item, i) => (
                  <details key={item.question} open={i === 0} className="group px-5 py-4 sm:px-6">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                      <span className="text-sm font-semibold text-gray-900 sm:text-base">
                        {item.question}
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-[#5b21b6] transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA ───────────────────────────────────────────────── */}
        <section className="pb-12">
          <div className="overflow-hidden rounded-2xl border border-purple-100 bg-[#f8f7fc] p-6 sm:p-10">
            <div className="grid items-center gap-8 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <h2 className="text-balance text-[21px] font-semibold tracking-tight text-gray-900 sm:text-[25px]">
                  Read the guide, then put it to work
                </h2>
                <p className="mt-3 max-w-2xl text-gray-600">
                  AINOS keeps the invoice, the credit, the follow-up, the payroll and the stock on one
                  record - so the checklist in a guide becomes the way your business runs, not a file you
                  forget.
                </p>
                <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#5b21b6]" /> GST invoicing and reports
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#5b21b6]" /> CRM, marketing and AI tools
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#5b21b6]" /> HR, payroll and inventory
                  </li>
                </ul>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:flex-col lg:items-stretch">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4c1d95] to-[#6d28d9] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition-opacity hover:opacity-95"
                >
                  Create your account <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/features"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-800 transition-colors hover:border-purple-300 hover:text-[#4c1d95]"
                >
                  Explore every suite
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
