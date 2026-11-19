'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Lightbulb, X } from 'lucide-react';
import { IconCircle } from '@/components/dashboard/kit';
import { verticalByKey } from '@/lib/verticals';
import { guideForPath, workspaceHref } from '@/lib/workspace-guides';

/** "How to use" button for the top bar; opens the current tool's guide in a side panel. */
export function PageGuideButton({ pathname }: { pathname: string }) {
  const match = useMemo(() => guideForPath(pathname), [pathname]);
  // Tied to the path it was opened on, so navigating away closes it.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = !!match && openFor === pathname;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenFor(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!match) return null;
  const { group, item, guide } = match;
  const workspaceTitle = verticalByKey(group.key)?.title ?? group.title;
  const close = () => setOpenFor(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpenFor(pathname)}
        aria-label={`How to use ${item.label}`}
        className="inline-flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-full bg-purple-50 border border-purple-100 text-[#5b21b6] text-xs font-semibold hover:bg-purple-100 transition-colors whitespace-nowrap"
      >
        <BookOpen className="w-4 h-4" />
        <span className="hidden sm:inline">How to use</span>
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[80] flex justify-end" role="dialog" aria-modal="true" aria-label={`How to use ${item.label}`}>
          <button type="button" aria-label="Close guide" onClick={close} className="absolute inset-0 bg-neutral-900/30" />
          <motion.aside
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-md h-full bg-white shadow-[0_0_40px_-10px_rgba(16,24,40,0.35)] flex flex-col"
          >
            <div className="flex items-start gap-3 p-5 border-b border-neutral-100">
              <IconCircle icon={item.icon} variant="gradient" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5b21b6]">How to use</p>
                <h2 className="text-base font-bold text-neutral-900 truncate">{item.label}</h2>
                <p className="text-xs text-neutral-500 truncate">{workspaceTitle}</p>
              </div>
              <button type="button" onClick={close} aria-label="Close guide"
                className="w-11 h-11 -mr-2 -mt-2 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100 flex-shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <p className="text-sm text-neutral-700 leading-relaxed">{guide.summary}</p>

              <div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-3">Step by step</h3>
                <ol className="space-y-3">
                  {guide.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-neutral-700 leading-relaxed">
                      <span className="w-6 h-6 rounded-full bg-[#5b21b6] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <span className="min-w-0 pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {guide.tip && (
                <div className="flex gap-2.5 rounded-xl bg-[#faf8ff] border border-purple-100 p-3.5 text-sm text-neutral-700 leading-relaxed">
                  <Lightbulb className="w-4 h-4 text-[#5b21b6] flex-shrink-0 mt-0.5" />
                  <span className="min-w-0">{guide.tip}</span>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-neutral-100 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
              <Link href={workspaceHref(group.key)} onClick={close}
                className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-purple-200 text-[#5b21b6] text-sm font-semibold hover:bg-purple-50 transition-colors">
                Open the {workspaceTitle} dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.aside>
        </div>,
        document.body,
      )}
    </>
  );
}
