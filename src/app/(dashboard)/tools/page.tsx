'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Coins, Workflow, ArrowRight, Search, Star, Megaphone, Users, Timer, Wallet, Palette, Brush,
  Briefcase, ShoppingBag, LifeBuoy, BookOpen, Store, TrendingUp, Package, UserCog, Lock,
  History, Boxes, Clock,
} from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  creditCost: number;
  iconUrl?: string;
  accessible?: boolean;
  level?: number;
  requiredPlan?: string;
}

interface RunItem {
  id: string;
  tool: string | null;
  toolName: string | null;
  status: string;
  createdAt: string;
  headline: string | null;
  inputHint: string | null;
}

interface Overview {
  creditBalance: number;
  activeTools: number;
  runsThisMonth: number;
  toolsUsed: number;
  recent: RunItem[];
}

const categoryIcons: Record<string, typeof Workflow> = {
  ai: Star,
  marketing: Megaphone,
  crm: Users,
  productivity: Timer,
  finance: Wallet,
  branding: Palette,
  design: Brush,
  business: Briefcase,
  ecommerce: ShoppingBag,
  support: LifeBuoy,
  content: BookOpen,
  web: Store,
  sales: TrendingUp,
  operations: Package,
  hr: UserCog,
};

function ToolIcon({ category, className }: { category?: string; className?: string }) {
  const Icon = categoryIcons[category || ''] || Workflow;
  return <Icon className={className} />;
}

const TILE = 'bg-gradient-to-br from-[#5b21b6] to-[#a78bfa]';

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const mins = Math.max(1, Math.floor((Date.now() - then) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/tools')
      .then(res => res.json())
      .then(data => { setTools(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
    fetch('/api/tools/overview')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data && !data.error) setOverview(data); })
      .catch(() => {});
  }, []);

  const categories = useMemo(
    () => ['all', ...new Set(tools.map(t => t.category).filter(Boolean))],
    [tools]
  );
  const filteredTools = tools
    .filter(t => category === 'all' || t.category === category)
    .filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()));

  const unlockedCount = tools.filter(t => t.accessible !== false).length;
  const nameBySlug = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of tools) map[t.slug] = t.name;
    return map;
  }, [tools]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1 text-gray-900">Tools dashboard</h1>
        <p className="text-gray-500">Every tool in one place — open any card for its guide, run form and history.</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6"
      >
        <div className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
            <Coins className="w-4 h-4 text-[#7c3aed]" /> Credit balance
          </div>
          <p className="text-xl md:text-2xl font-bold text-gray-900">
            {overview ? overview.creditBalance.toLocaleString('en-IN') : '—'}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
            <Workflow className="w-4 h-4 text-[#7c3aed]" /> Tools unlocked
          </div>
          <p className="text-xl md:text-2xl font-bold text-gray-900">
            {loading ? '—' : `${unlockedCount}/${tools.length}`}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
            <History className="w-4 h-4 text-[#7c3aed]" /> Runs this month
          </div>
          <p className="text-xl md:text-2xl font-bold text-gray-900">
            {overview ? overview.runsThisMonth.toLocaleString('en-IN') : '—'}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
            <Boxes className="w-4 h-4 text-[#7c3aed]" /> Tools tried
          </div>
          <p className="text-xl md:text-2xl font-bold text-gray-900">
            {overview ? overview.toolsUsed : '—'}
          </p>
        </div>
      </motion.div>

      {/* Recently used */}
      {overview && overview.recent.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gray-400" /> Recently used
            </h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 [scrollbar-width:thin]">
            {overview.recent.slice(0, 5).map(run => (
              <button
                key={run.id}
                onClick={() => run.tool && router.push(`/tools/execute/${run.tool}`)}
                className="flex-shrink-0 w-56 text-left rounded-xl border border-gray-100 bg-white px-4 py-3 hover:border-purple-300 hover:shadow-sm transition-all"
              >
                <p className="text-xs font-semibold text-[#5b21b6] truncate">
                  {run.tool ? nameBySlug[run.tool] || run.toolName || run.tool : run.toolName || 'Tool'}
                </p>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {run.headline || run.inputHint || 'Completed run'}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">{timeAgo(run.createdAt)}</p>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tools…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />
        </div>
        <div className="flex gap-2 flex-nowrap overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize whitespace-nowrap ${
                category === cat
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="min-h-[13rem] h-[13rem] bg-white border border-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredTools.length === 0 ? (
        <div className="text-center py-16">
          <Workflow className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-gray-700">No tools found</h3>
          <p className="text-gray-400">Try a different search or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredTools.map(tool => {
            const locked = tool.accessible === false;
            return (
              <div
                key={tool.id}
                className="relative min-h-[13rem] flex flex-col bg-white border border-gray-100 rounded-2xl p-5 md:p-6 hover:border-purple-300 hover:shadow-md transition-all group cursor-pointer"
                onClick={() => router.push(`/tools/execute/${tool.slug}`)}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className={`w-10 h-10 rounded-lg ${TILE} flex items-center justify-center flex-shrink-0`}>
                    <ToolIcon category={tool.category} className="w-5 h-5 text-white" />
                  </div>
                  <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600 flex-shrink-0">
                    <Coins className="w-3 h-3 text-amber-500" />
                    {tool.creditCost} credits
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 group-hover:text-purple-700 transition-colors truncate">{tool.name}</h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{tool.description || 'No description available'}</p>
                <div className="mt-auto flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                    <BookOpen className="w-3 h-3" /> Guide included
                  </span>
                  {locked ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-purple-600">
                      <Lock className="w-3.5 h-3.5" /> Unlock
                    </span>
                  ) : (
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-purple-600 transition-colors" />
                  )}
                </div>
                {locked && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold shadow whitespace-nowrap">
                      <Lock className="w-3 h-3" /> {tool.requiredPlan === 'marketing' ? 'Marketing plan' : 'Locked'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
