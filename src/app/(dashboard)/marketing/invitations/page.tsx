'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Video, Sparkles, Search, X, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import CategoryFilter from './components/CategoryFilter';
import TemplateCard from './components/TemplateCard';
import { TEMPLATES, CATEGORIES, getGroup, getGroupIds, LANGUAGES } from '@/data/invitations/templates';

const PICKS_KEY = 'ainos_invitation_picks';
const readPicks = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(PICKS_KEY) || '[]'));
  } catch {
    return new Set();
  }
};

const SORTS = [
  { id: 'featured', label: 'Featured' },
  { id: 'newest', label: 'Newest first' },
  { id: 'occasion', label: 'Occasion A–Z' },
  { id: 'name', label: 'Design A–Z' },
];

const PAGE_SIZE = 24;

const TOOL_BASE = 'inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-xs font-semibold border transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#800020]/20';
const TOOL_OFF = 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-[#eadfc9] dark:border-gray-600 hover:border-[#800020]/45 hover:text-[#800020]';
const TOOL_ON = 'bg-[#800020] text-white border-[#800020] shadow-[0_8px_18px_-12px_rgba(128,0,32,1)]';
const TOOL_ON_ROSE = 'bg-[#e0486b] text-white border-[#e0486b] shadow-[0_8px_18px_-12px_rgba(224,72,107,1)]';

export default function InvitationsPage() {
  const searchParams = useSearchParams();
  const [templates] = useState(TEMPLATES);
  const [showVideoOnly, setShowVideoOnly] = useState(false);
  const [language, setLanguage] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');
  const [picks, setPicks] = useState(readPicks);
  const [showPicksOnly, setShowPicksOnly] = useState(false);
  const [page, setPage] = useState(1);
  const router = useRouter();

  // Sync category from URL on mount (searchParams is stable client-side)
  const urlCategory = searchParams.get('category');
  const [activeCategory, setActiveCategory] = useState(urlCategory || 'all');

  const togglePick = (key: string) => {
    setPicks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      try { localStorage.setItem(PICKS_KEY, JSON.stringify([...next])); } catch { /* storage full */ }
      return next;
    });
  };

  const filteredTemplates = useMemo(() => {
    const q = query.trim().toLowerCase();
    const groupIds = getGroupIds(activeCategory);
    const list = templates.filter((t) => {
      if (groupIds) { if (!groupIds.includes(t.category)) return false; }
      else if (activeCategory !== 'all' && t.category !== activeCategory) return false;
      if (showVideoOnly && !t.hasVideo) return false;
      if (language !== 'all' && t.language !== language) return false;
      if (showPicksOnly && !picks.has(t.slug || t._id)) return false;
      if (q) {
        const hay = `${t.name} ${t.category} ${t.sampleText?.event || ''} ${t.sampleText?.blessing || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (sort === 'newest') return [...list].reverse();
    if (sort === 'occasion') return [...list].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    if (sort === 'name') return [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [templates, activeCategory, showVideoOnly, language, showPicksOnly, picks, query, sort]);

  // Reset to page 1 when filters change
  useEffect(() => { queueMicrotask(() => setPage(1)); }, [activeCategory, showVideoOnly, language, showPicksOnly, query, sort]);

  // Sync page from URL on mount
  const urlPage = parseInt(searchParams.get('page') || '1', 10);
  useEffect(() => { if (urlPage > 1) queueMicrotask(() => setPage(urlPage)); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const goToPage = useCallback((p: number) => {
    setPage(p);
    router.replace(`?page=${p}`, { scroll: false });
    document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [router]);

  const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const shown = filteredTemplates.slice(startIdx, startIdx + PAGE_SIZE);
  const hasFilters = activeCategory !== 'all' || showVideoOnly || language !== 'all' || query.trim() !== '' || showPicksOnly;
  const totalTemplates = templates.length;
  const videoTemplates = templates.filter((t) => t.hasVideo).length;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-6 pb-10 md:pt-10 md:pb-14 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#800020]/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-64 h-64 bg-[#B8860B]/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#800020]/10 text-[#800020] dark:text-[#e8a0b0] text-xs md:text-sm font-medium mb-6 border border-[#800020]/20">
                <Sparkles className="w-4 h-4" />
                <span>{totalTemplates}+ Premium Templates · Video + Audio</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#800020] dark:text-[#e8a0b0] leading-[1.1] mb-5">
                Beautiful invites for
                <span className="block text-[#B8860B] dark:text-[#d4a84b]">every celebration</span>
              </h1>

              <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 mb-3 max-w-xl leading-relaxed">
                Weddings, festivals, birthdays, baby showers and more. Customize in minutes, download instantly.
              </p>

              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-lg">
                Apno ko bulane ka naya tareeka. Hindi, English, Marathi — WhatsApp ready invites with Indian music.
              </p>

              {/* Pricing Cards */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-[#e8dcc4] dark:border-gray-700 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-[#800020]/10 flex items-center justify-center text-[#800020] dark:text-[#e8a0b0]">
                    <span className="font-bold text-sm">₹49</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Clean Image</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">PNG + PDF without watermark</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-[#e8dcc4] dark:border-gray-700 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-[#B8860B]/15 flex items-center justify-center text-[#B8860B]">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">₹99 Image + Video</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Both files with Indian music</p>
                  </div>
                </div>
              </div>

              <a
                href="#templates"
                className="inline-flex items-center gap-2 bg-[#800020] text-white px-8 py-4 rounded-full font-semibold text-base hover:bg-[#6a0018] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Create your invitation
                <span className="text-lg">→</span>
              </a>
            </motion.div>

            {/* Right: Preview Cards Stack */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:flex justify-center items-center relative h-[400px]"
            >
              <div className="absolute left-2 top-10 w-[200px] h-[320px] rounded-3xl overflow-hidden shadow-2xl transform -rotate-6 border-4 border-white dark:border-gray-700">
                <img src="/templates/wedding-04.png" alt="" className="w-full h-full object-cover" />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[230px] h-[370px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-gray-700 z-10">
                <img src="/templates/ganpati-05.png" alt="" className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 backdrop-blur-md bg-[#800020]/90 text-white text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1 shadow-lg border border-white/20">
                  <Video className="w-3.5 h-3.5" /> + Video
                </div>
              </div>
              <div className="absolute right-2 top-14 w-[200px] h-[320px] rounded-3xl overflow-hidden shadow-2xl transform rotate-6 border-4 border-white dark:border-gray-700">
                <img src="/templates/diwali-02.png" alt="" className="w-full h-full object-cover" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 py-4 px-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-[#e8dcc4] dark:border-gray-700">
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-[#800020] dark:text-[#e8a0b0]">{totalTemplates}+</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Templates</p>
            </div>
            <div className="w-px h-10 bg-[#e8dcc4] dark:bg-gray-600 hidden sm:block" />
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-[#800020] dark:text-[#e8a0b0]">{videoTemplates}+</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">With Video</p>
            </div>
            <div className="w-px h-10 bg-[#e8dcc4] dark:bg-gray-600 hidden sm:block" />
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-[#800020] dark:text-[#e8a0b0]">3</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Languages</p>
            </div>
            <div className="w-px h-10 bg-[#e8dcc4] dark:bg-gray-600 hidden sm:block" />
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-[#800020] dark:text-[#e8a0b0]">{CATEGORIES.length - 1}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Occasions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="sticky top-0 z-30 border-y border-[#f0e3cd] dark:border-gray-700 py-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white dark:bg-gray-800 border border-[#eadfc9] dark:border-gray-600 shadow-sm p-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative order-1 basis-full sm:basis-auto sm:flex-1 min-w-[200px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search designs — ganpati, mandala, haldi, royal blue…"
                  className="w-full h-10 pl-10 pr-9 rounded-full bg-[#fdfaf5] dark:bg-gray-700 border border-[#eadfc9] dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]/40 focus:bg-white transition-colors"
                  aria-label="Search templates"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200/80 text-gray-600 flex items-center justify-center hover:bg-gray-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort designs"
                className={`${TOOL_BASE} ${TOOL_OFF} appearance-none pr-5 cursor-pointer`}
              >
                {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                aria-label="Filter by language"
                className={`${TOOL_BASE} ${TOOL_OFF} appearance-none pr-5 cursor-pointer`}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>{l.id === 'all' ? 'All languages' : l.label}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowVideoOnly((v) => !v)}
                aria-pressed={showVideoOnly}
                className={`${TOOL_BASE} ${showVideoOnly ? TOOL_ON : TOOL_OFF}`}
              >
                <Video className="w-3.5 h-3.5" /> Video
              </button>

              <button
                type="button"
                onClick={() => setShowPicksOnly((v) => !v)}
                aria-pressed={showPicksOnly}
                className={`${TOOL_BASE} ${showPicksOnly ? TOOL_ON_ROSE : TOOL_OFF}`}
              >
                <Heart className={`w-4 h-4 ${showPicksOnly ? 'fill-current' : ''}`} />
                My picks
                <span className={showPicksOnly ? 'text-white/75' : 'text-gray-400'}>{picks.size}</span>
              </button>

              {hasFilters && (
                <button
                  type="button"
                  onClick={() => { setActiveCategory('all'); setShowVideoOnly(false); setLanguage('all'); setQuery(''); setShowPicksOnly(false); setSort('featured'); }}
                  className={`${TOOL_BASE} bg-white dark:bg-gray-800 text-[#800020] border-[#800020]/25 hover:bg-[#800020]/8`}
                >
                  <X className="w-3.5 h-3.5" /> Reset
                </button>
              )}
            </div>
          </div>

          <div className="mt-2.5">
            <CategoryFilter activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
          </div>
        </div>
      </section>

      {/* Templates Section */}
      <section id="templates" className="py-6 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-[#800020] dark:text-[#e8a0b0]">
              {showPicksOnly
                ? 'My picked designs'
                : activeCategory === 'all'
                  ? 'All Templates'
                  : getGroup(activeCategory)?.allLabel || CATEGORIES.find(c => c.id === activeCategory)?.label || 'Templates'}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {filteredTemplates.length} design{filteredTemplates.length === 1 ? '' : 's'}
              {filteredTemplates.length > PAGE_SIZE ? ` · page ${safePage} of ${totalPages}` : ''}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
            {shown.map((template, idx) => (
              <TemplateCard
                key={template._id}
                template={template}
                index={idx}
                favourite={picks.has(template.slug || template._id)}
                onToggleFavourite={togglePick}
              />
            ))}
          </div>

          {/* Pagination */}
          {filteredTemplates.length > PAGE_SIZE && (
            <div className="mt-8 flex flex-col items-center gap-3">
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => goToPage(safePage - 1)}
                  className="inline-flex items-center gap-1 h-9 px-3 rounded-full text-xs font-semibold border transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-[#eadfc9] dark:border-gray-600 hover:border-[#800020]/45 hover:text-[#800020]"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>

                {(() => {
                  const pages: (number | '...')[] = [];
                  const add = (p: number) => { if (!pages.includes(p)) pages.push(p); };
                  add(1);
                  if (safePage > 3) pages.push('...');
                  for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) add(i);
                  if (safePage < totalPages - 2) pages.push('...');
                  if (totalPages > 1) add(totalPages);
                  return pages.map((p, i) => (
                    p === '...' ? (
                      <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-xs text-gray-400">…</span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        onClick={() => goToPage(p as number)}
                        className={`w-9 h-9 rounded-full text-xs font-semibold border transition-all ${
                          p === safePage
                            ? 'bg-[#800020] text-white border-[#800020] shadow-[0_8px_18px_-12px_rgba(128,0,32,1)]'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-[#eadfc9] dark:border-gray-600 hover:border-[#800020]/45 hover:text-[#800020]'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  ));
                })()}

                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => goToPage(safePage + 1)}
                  className="inline-flex items-center gap-1 h-9 px-3 rounded-full text-xs font-semibold border transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-[#eadfc9] dark:border-gray-600 hover:border-[#800020]/45 hover:text-[#800020]"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xs text-gray-400">
                Page {safePage} of {totalPages} · {filteredTemplates.length} designs
              </span>
            </div>
          )}

          {filteredTemplates.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">
                {showPicksOnly && picks.size === 0
                  ? 'Tap the heart on any design to keep it here while you browse.'
                  : 'No designs match these filters yet.'}
              </p>
              <button
                onClick={() => { setActiveCategory('all'); setShowVideoOnly(false); setLanguage('all'); setQuery(''); setShowPicksOnly(false); }}
                className="mt-4 px-6 py-2 rounded-full bg-[#800020] text-white text-sm font-semibold hover:bg-[#6a0018] transition-all"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
