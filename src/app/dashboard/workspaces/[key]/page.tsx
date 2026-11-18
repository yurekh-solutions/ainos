'use client';

import { useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, Lightbulb, LayoutGrid, ListChecks } from 'lucide-react';
import { CARD, PAGE, CONTAINER, fadeUp, IconCircle } from '@/components/dashboard/kit';
import { NAV_GROUPS, type NavItem } from '@/components/layout/navigation';
import { verticalByKey } from '@/lib/verticals';
import { PAGE_GUIDES, WORKSPACE_GUIDES, type PageGuide } from '@/lib/workspace-guides';

const FALLBACK_GUIDE: PageGuide = {
  summary: 'Open the tool and follow the on-screen steps.',
  steps: ['Open the tool.', 'Add your first entry.', 'Save and review it in the list.'],
};

export default function WorkspaceDashboardPage() {
  const params = useParams<{ key: string }>();
  const vertical = verticalByKey(params?.key);
  const group = NAV_GROUPS.find(g => g.key === params?.key);
  const [openGuide, setOpenGuide] = useState<string | null>(null);

  if (!vertical || !group) notFound();

  const Icon = vertical.icon;
  const workspace = WORKSPACE_GUIDES[group.key];
  const guideOf = (href: string) => PAGE_GUIDES[href] ?? FALLBACK_GUIDE;
  const startItems = workspace.startHere
    .map(href => group.items.find(i => i.href === href))
    .filter((i): i is NavItem => !!i);
  const firstTool = startItems[0] ?? group.items[0];
  // Finance and Marketing also have a numbers overview page of their own.
  const overviewHref = group.items.some(i => i.href === group.href) ? null : group.href;

  return (
    <div className={PAGE}>
      <div className={CONTAINER}>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-[#5b21b6] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> All workspaces
        </Link>

        {/* Workspace header */}
        <motion.section {...fadeUp(0.02)} className={`${CARD} p-5 sm:p-6`}>
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <IconCircle icon={Icon} variant="gradient" size="lg" />
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">{vertical.title}</h1>
                <p className="text-sm text-neutral-500 mt-0.5">{vertical.tagline}</p>
                <p className="text-sm text-neutral-700 mt-3 leading-relaxed max-w-2xl">{workspace.intro}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 text-[#5b21b6] text-xs font-semibold">
                    <LayoutGrid className="w-3.5 h-3.5" /> {group.items.length} {group.items.length === 1 ? 'tool' : 'tools'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 text-[#5b21b6] text-xs font-semibold">
                    <BookOpen className="w-3.5 h-3.5" /> Guide for every tool
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row md:flex-col gap-2 md:w-52 flex-shrink-0">
              {firstTool && (
                <Link href={firstTool.href} className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-gradient-to-r from-[#4c1d95] to-[#6d28d9] text-white text-sm font-semibold hover:opacity-95 transition-opacity">
                  Open {firstTool.label} <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              {overviewHref && (
                <Link href={overviewHref} className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl border border-purple-200 text-[#5b21b6] text-sm font-semibold hover:bg-purple-50 transition-colors">
                  Numbers overview
                </Link>
              )}
            </div>
          </div>
        </motion.section>

        {/* Start here: the order a new user should open the tools in */}
        {startItems.length > 1 && (
          <motion.section {...fadeUp(0.06)} aria-label="Start here">
            <div className="flex items-center gap-2 mb-3">
              <ListChecks className="w-4 h-4 text-[#5b21b6]" />
              <h2 className="text-base font-semibold text-neutral-900">New here? Start in this order</h2>
            </div>
            <div className={`grid grid-cols-1 gap-3 ${startItems.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
              {startItems.map((item, i) => (
                <Link key={item.href} href={item.href}
                  className={`${CARD} p-4 flex items-start gap-3 min-w-0 border border-transparent hover:border-purple-200 transition-colors`}>
                  <span className="w-7 h-7 rounded-full bg-[#5b21b6] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-neutral-900 truncate">{item.label}</p>
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{guideOf(item.href).summary}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-300 flex-shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* Every tool on its own card with its how-to guide */}
        <motion.section {...fadeUp(0.1)} aria-label="All tools">
          <div className="mb-3">
            <h2 className="text-base font-semibold text-neutral-900">All {vertical.shortTitle} tools</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Tap How to use for the steps. Inside each tool, the How to use button at the top shows them again.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
            {group.items.map(item => {
              const guide = guideOf(item.href);
              const open = openGuide === item.href;
              return (
                <div key={item.href} className={`${CARD} p-4 flex flex-col gap-3 min-w-0 border ${open ? 'border-purple-200' : 'border-transparent'}`}>
                  <div className="flex items-start gap-3 min-w-0">
                    <IconCircle icon={item.icon} variant="gradient" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="text-sm font-semibold text-neutral-900 truncate">{item.label}</h3>
                        {item.tier === 'advanced' && (
                          <span className="px-1.5 py-0.5 rounded-md bg-neutral-100 text-neutral-500 text-[10px] font-semibold flex-shrink-0">Advanced</span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{guide.summary}</p>
                    </div>
                  </div>

                  {open && (
                    <div className="rounded-xl bg-[#faf8ff] border border-purple-100 p-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5b21b6] mb-2">How to use</p>
                      <ol className="space-y-2">
                        {guide.steps.map((step, i) => (
                          <li key={i} className="flex gap-2.5 text-[13px] text-neutral-700 leading-relaxed">
                            <span className="w-5 h-5 rounded-full bg-white border border-purple-200 text-[#5b21b6] text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                            <span className="min-w-0">{step}</span>
                          </li>
                        ))}
                      </ol>
                      {guide.tip && (
                        <p className="flex gap-2 mt-3 pt-3 border-t border-purple-100 text-xs text-neutral-600 leading-relaxed">
                          <Lightbulb className="w-3.5 h-3.5 text-[#5b21b6] flex-shrink-0 mt-0.5" />
                          <span className="min-w-0">{guide.tip}</span>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenGuide(open ? null : item.href)}
                      aria-expanded={open}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:border-purple-200 hover:text-[#5b21b6] transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" /> How to use
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </button>
                    <Link
                      href={item.href}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-xl bg-[#5b21b6] hover:bg-[#4c1d95] text-white text-xs font-semibold transition-colors"
                    >
                      Open <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
