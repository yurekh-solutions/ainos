'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Send, PenTool, Megaphone, ArrowRight } from 'lucide-react';
import {
  CARD, PAGE, CONTAINER, fadeUp, IconCircle, PageHeader, WidgetHeader, ViewAll, Skeleton, StatusPill, Tone,
  marketingTools, useTemplateCount, formatDate,
} from '@/components/dashboard/kit';

interface Activity {
  id: string;
  title: string;
  kind: string;
  href: string;
  icon: React.ElementType;
  tone: Tone;
  status: string;
  date: string;
}

/** Latest email campaigns and blog posts, newest first. */
function useRecentActivity(limit = 5) {
  const [items, setItems] = useState<Activity[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/email-campaigns').then(r => (r.ok ? r.json() : [])).catch(() => []),
      fetch('/api/blog-posts?status=published').then(r => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([campaigns, blog]) => {
      if (cancelled) return;
      const emailRows: Activity[] = (Array.isArray(campaigns) ? campaigns : []).map((c: Record<string, unknown>) => ({
        id: `email-${c.id}`,
        title: String(c.name || c.subject || 'Untitled campaign'),
        kind: 'Email campaign',
        href: '/marketing/campaigns',
        icon: Send,
        tone: 'purple' as Tone,
        status: String(c.status || 'draft'),
        date: String(c.sentAt || c.createdAt || ''),
      }));
      const posts = Array.isArray(blog?.posts) ? blog.posts : [];
      const blogRows: Activity[] = posts.map((p: Record<string, unknown>) => ({
        id: `blog-${p.id}`,
        title: String(p.title || 'Untitled post'),
        kind: 'Blog post',
        href: '/marketing/blog',
        icon: PenTool,
        tone: 'orange' as Tone,
        status: String(p.status || 'draft'),
        date: String(p.publishedAt || p.createdAt || ''),
      }));
      const time = (d: string) => new Date(d).getTime() || 0;
      setItems([...emailRows, ...blogRows].sort((a, b) => time(b.date) - time(a.date)).slice(0, limit));
    }).finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [limit]);

  return { items, loaded };
}

export default function MarketingOverviewPage() {
  const templateLabel = useTemplateCount();
  const tools = marketingTools(templateLabel);
  const { items, loaded } = useRecentActivity();

  return (
    <div className={PAGE}>
      <div className={CONTAINER}>
        <PageHeader title="Marketing" subtitle="Grow your brand with powerful tools and automation." />

        {/* Tools */}
        <motion.section {...fadeUp(0.04)} className={`${CARD} p-2 sm:p-3`}>
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {tools.map(tool => (
              <Link
                key={tool.title}
                href={tool.href}
                className="group flex flex-col items-start gap-2.5 sm:gap-3 p-3 sm:p-5 rounded-xl hover:bg-[#f7f5fb] transition-colors min-w-0"
              >
                <IconCircle icon={tool.icon} />
                <div className="min-w-0 w-full">
                  <p className="text-[12px] sm:text-sm font-medium text-neutral-900 group-hover:text-[#6d28d9] transition-colors leading-snug">{tool.title}</p>
                  <p className="hidden sm:block text-xs text-neutral-500 font-light mt-0.5 truncate">{tool.short}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.section>

        {/* Recent campaigns */}
        <motion.section {...fadeUp(0.08)} className={CARD}>
          <WidgetHeader
            title="Recent campaigns"
            subtitle="Your latest marketing activities"
            action={items.length > 0 && <ViewAll href="/marketing/campaigns" />}
          />
          <div className="px-3 sm:px-4 pb-4">
            {!loaded ? (
              <div className="space-y-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="flex items-center gap-4 p-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="px-6 pt-4 pb-8 text-center">
                <div className="flex justify-center"><IconCircle icon={Megaphone} size="lg" /></div>
                <p className="text-sm font-medium text-neutral-900 mt-4">No campaigns yet</p>
                <p className="text-sm text-neutral-500 font-light mt-1">Email campaigns and published blogs will show up here.</p>
                <Link
                  href="/marketing/campaigns"
                  className="inline-flex items-center gap-2 mt-5 px-5 h-10 rounded-full bg-[#6d28d9] hover:bg-[#5b21b6] text-white text-sm font-medium transition-colors"
                >
                  Start a campaign <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {items.map(item => (
                  <li key={item.id}>
                    <Link href={item.href} className="flex items-center gap-3 sm:gap-4 px-3 py-3 rounded-xl hover:bg-[#f7f5fb] transition-colors">
                      <IconCircle icon={item.icon} tone={item.tone} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">{item.title}</p>
                        <p className="text-xs text-neutral-500 font-light truncate mt-0.5">
                          {item.kind}{formatDate(item.date, true) && ` · ${formatDate(item.date, true)}`}
                        </p>
                      </div>
                      <StatusPill status={item.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
