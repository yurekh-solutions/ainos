'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Coins, Zap, ArrowRight, Search, Sparkles, Megaphone, Users, Timer, Wallet, Palette, Brush, Briefcase, ShoppingBag, LifeBuoy, BookOpen, Globe, TrendingUp, Package, UserCog, Lock } from 'lucide-react';

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

const categoryColors: Record<string, string> = {
  ai: 'from-purple-500 to-pink-500',
  marketing: 'from-blue-500 to-cyan-500',
  crm: 'from-green-500 to-emerald-500',
  productivity: 'from-orange-500 to-yellow-500',
  finance: 'from-indigo-500 to-purple-500',
  branding: 'from-violet-500 to-fuchsia-500',
  design: 'from-pink-500 to-rose-500',
  business: 'from-teal-500 to-emerald-500',
  ecommerce: 'from-amber-500 to-orange-500',
  support: 'from-cyan-500 to-blue-500',
  content: 'from-emerald-500 to-teal-500',
  web: 'from-indigo-500 to-violet-500',
  sales: 'from-green-500 to-emerald-500',
  operations: 'from-slate-500 to-gray-500',
  hr: 'from-rose-500 to-pink-500',
};

const categoryIcons: Record<string, typeof Zap> = {
  ai: Sparkles,
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
  web: Globe,
  sales: TrendingUp,
  operations: Package,
  hr: UserCog,
};

function ToolIcon({ category, className }: { category?: string; className?: string }) {
  const Icon = categoryIcons[category || ''] || Zap;
  return <Icon className={className} />;
}

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/tools')
      .then(res => res.json())
      .then(data => { setTools(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const categories = ['all', ...new Set(tools.map(t => t.category).filter(Boolean))];
  const filteredTools = tools
    .filter(t => category === 'all' || t.category === category)
    .filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900">Tool Marketplace</h1>
        <p className="text-gray-500">Powerful tools to automate your business. Pay with credits.</p>
      </motion.div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tools..."
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
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="min-h-[13rem] h-[13rem] bg-white border border-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredTools.length === 0 ? (
        <div className="text-center py-16">
          <Zap className="w-12 h-12 mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-gray-700">No tools found</h3>
          <p className="text-gray-400">Tools will appear here once added by the platform.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => {
            const locked = tool.accessible === false;
            return (
              <div
                key={tool.id}
                className="relative min-h-[13rem] flex flex-col bg-white border border-gray-100 rounded-2xl p-6 hover:border-purple-300 hover:shadow-md transition-all group cursor-pointer"
                onClick={() => router.push(`/tools/execute/${tool.slug}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${categoryColors[tool.category] || 'from-gray-500 to-gray-600'} flex items-center justify-center`}>
                    <ToolIcon category={tool.category} className="w-5 h-5 text-white" />
                  </div>
                  <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                    <Coins className="w-3 h-3 text-yellow-400" />
                    {tool.creditCost} credits
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">{tool.name}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{tool.description || 'No description available'}</p>
                <div className="mt-auto flex items-center justify-between">
                  {tool.category && (
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-lg text-gray-500 capitalize">{tool.category}</span>
                  )}
                  {locked ? (
                    <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-purple-600">
                      <Lock className="w-3.5 h-3.5" /> Unlock
                    </span>
                  ) : (
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors ml-auto" />
                  )}
                </div>
                {locked && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold shadow">
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
