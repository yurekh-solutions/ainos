'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MoreHorizontal } from 'lucide-react';
import {
  CARD, PAGE, CONTAINER, fadeUp, IconCircle, PageHeader, WidgetHeader, ViewAll, ToolItem,
  FINANCE_TOOLS, useFinanceSummary, RecentInvoicesCard, CollectionsCard, GettingStartedCard,
} from '@/components/dashboard/kit';

const QUICK_COUNT = 4;
const PREVIEW_COUNT = 6;

export default function FinanceOverviewPage() {
  const { data, loaded, collectionRate } = useFinanceSummary();
  const [showAll, setShowAll] = useState(false);

  const quick = FINANCE_TOOLS.slice(0, QUICK_COUNT);
  const tools = showAll ? FINANCE_TOOLS : FINANCE_TOOLS.slice(0, PREVIEW_COUNT);

  const openAllTools = () => {
    setShowAll(true);
    document.getElementById('finance-tools')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={PAGE}>
      <div className={CONTAINER}>
        <PageHeader title="Finance" subtitle="Manage your invoices, customers, products and more." />

        {/* Quick access */}
        <motion.section {...fadeUp(0.04)} className={`${CARD} p-2 sm:p-3`}>
          <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
            {quick.map((tool, i) => {
              const primary = i === 0;
              return (
                <Link
                  key={tool.title}
                  href={tool.href}
                  className={`group flex flex-col items-center justify-center gap-2 py-3 sm:py-5 px-1 rounded-xl text-center transition-all duration-200 min-w-0 ${
                    primary
                      ? 'bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] text-white shadow-[0_8px_18px_-8px_rgba(109,40,217,0.8)]'
                      : 'bg-[#faf9fc] hover:bg-white hover:shadow-[0_10px_22px_-10px_rgba(76,29,149,0.25)] hover:-translate-y-0.5 text-neutral-700'
                  }`}
                >
                  {primary ? (
                    <span className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                      <tool.icon className="w-[18px] h-[18px]" />
                    </span>
                  ) : (
                    <IconCircle icon={tool.icon} tone={tool.tone} variant="gradient" />
                  )}
                  <span className="text-[11px] sm:text-[13px] font-medium truncate max-w-full">{tool.title}</span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={openAllTools}
              className="flex flex-col items-center justify-center gap-2 py-3 sm:py-5 px-1 rounded-xl text-center hover:bg-[#f7f5fb] text-neutral-500 transition-colors min-w-0"
            >
              <IconCircle icon={MoreHorizontal} tone="grey" />
              <span className="text-[11px] sm:text-[13px] font-medium truncate max-w-full">+{FINANCE_TOOLS.length - QUICK_COUNT} more</span>
            </button>
          </div>
        </motion.section>

        {/* Recent invoices + collections */}
        <motion.div {...fadeUp(0.08)} className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          <RecentInvoicesCard data={data} loaded={loaded} className="lg:col-span-2" />
          <CollectionsCard data={data} loaded={loaded} rate={collectionRate} />
        </motion.div>

        <GettingStartedCard data={data} loaded={loaded} />

        {/* All finance tools */}
        <motion.section id="finance-tools" {...fadeUp(0.2)} className={`${CARD} scroll-mt-6`}>
          <WidgetHeader
            title="Finance tools"
            subtitle="Billing, GST and everyday accounts"
            action={
              FINANCE_TOOLS.length > PREVIEW_COUNT && (
                <ViewAll onClick={() => setShowAll(!showAll)} label={showAll ? 'Show less' : 'View all'} />
              )
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 px-2 sm:px-3 pb-3">
            {tools.map(tool => <ToolItem key={tool.title} tool={tool} />)}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
