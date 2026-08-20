'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Coins, Zap, ArrowRight, Search } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  creditCost: number;
  iconUrl?: string;
}

const categoryColors: Record<string, string> = {
  ai: 'from-purple-500 to-pink-500',
  marketing: 'from-blue-500 to-cyan-500',
  crm: 'from-green-500 to-emerald-500',
  productivity: 'from-orange-500 to-yellow-500',
  finance: 'from-indigo-500 to-purple-500',
};

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/ainos/api/tools')
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
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Tool Marketplace</h1>
        <p className="text-gray-400">Powerful tools to automate your business. Pay with credits.</p>
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
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                category === cat
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
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
            <div key={i} className="h-48 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredTools.length === 0 ? (
        <div className="text-center py-16">
          <Zap className="w-12 h-12 mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-gray-300">No tools found</h3>
          <p className="text-gray-500">Tools will appear here once added by the platform.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool, i) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:border-purple-500/50 transition-all group cursor-pointer"
              onClick={() => router.push(`/ainos/tools/execute/${tool.slug}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${categoryColors[tool.category] || 'from-gray-500 to-gray-600'} flex items-center justify-center`}>
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="flex items-center gap-1 px-2 py-1 bg-gray-700/50 rounded-full text-xs text-gray-300">
                  <Coins className="w-3 h-3 text-yellow-400" />
                  {tool.creditCost} credits
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-purple-400 transition-colors">{tool.name}</h3>
              <p className="text-sm text-gray-400 mb-4 line-clamp-2">{tool.description || 'No description available'}</p>
              <div className="flex items-center justify-between">
                {tool.category && (
                  <span className="text-xs px-2 py-1 bg-gray-700/50 rounded text-gray-400 capitalize">{tool.category}</span>
                )}
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors ml-auto" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
