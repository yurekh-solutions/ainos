'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, BookOpen, Search, Eye, ThumbsUp, Tag } from 'lucide-react';

interface Article { id: string; title: string; content: string; category: string; status: string; visibility: string; views: number; helpful: number; tags?: string[]; slug: string; createdAt: string; }

const statusColors: Record<string, string> = { draft: '#636e72', published: '#00b894', archived: '#636e72' };
const visColors: Record<string, string> = { public: '#0984e3', internal: '#6c5ce7' };

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [form, setForm] = useState({ title: '', content: '', category: 'General', tags: '', visibility: 'internal' });

  useEffect(() => { fetchArticles(); }, []);

  const fetchArticles = async () => {
    try { const res = await fetch('/api/knowledge-base'); if (res.ok) setArticles(await res.json()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const res = await fetch('/api/knowledge-base', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, tags, slug, status: 'draft' }) });
      if (res.ok) { setForm({ title: '', content: '', category: 'General', tags: '', visibility: 'internal' }); setShowForm(false); fetchArticles(); }
    } catch (e) { console.error(e); }
  };

  const updateStatus = async (id: string, status: string) => {
    try { await fetch('/api/knowledge-base', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) }); fetchArticles(); } catch (e) { console.error(e); }
  };

  const filtered = articles.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) || a.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === 'all' || a.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const categories = [...new Set(articles.map(a => a.category))];
  const stats = {
    total: articles.length,
    published: articles.filter(a => a.status === 'published').length,
    draft: articles.filter(a => a.status === 'draft').length,
    totalViews: articles.reduce((s, a) => s + a.views, 0),
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Knowledge Base</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Internal documentation & help articles</p>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)', boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)' }}>
            <Plus className="w-4 h-4" /> New Article
          </motion.button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Articles', value: stats.total, gradient: 'from-violet-500 to-purple-600' },
            { label: 'Published', value: stats.published, gradient: 'from-emerald-500 to-teal-600' },
            { label: 'Drafts', value: stats.draft, gradient: 'from-gray-500 to-slate-600' },
            { label: 'Total Views', value: stats.totalViews, gradient: 'from-blue-500 to-cyan-600' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }} className="relative p-4 rounded-2xl"
              style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)', boxShadow: '0 4px 20px -4px rgb(0 0 0 / 0.08)' }}>
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${stat.gradient} rounded-l-2xl`} />
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{stat.label}</p>
              <p className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <input type="text" placeholder="Search articles..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full glass-input pl-10 pr-4 py-2.5 text-sm" />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="glass-input px-4 py-2.5 text-sm rounded-xl">
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
            <option value="General">General</option><option value="Product">Product</option><option value="HR">HR</option><option value="IT">IT</option><option value="Finance">Finance</option>
          </select>
        </div>

        {loading ? <div className="text-center py-20" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
          : filtered.length === 0 ? (
            <div className="text-center py-20 p-8 rounded-2xl" style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)' }}>
              <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <p style={{ color: 'hsl(var(--foreground))' }}>No articles found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((article, i) => (
                <motion.div key={article.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -4 }} className="relative p-5 rounded-2xl group"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)', boxShadow: '0 4px 20px -4px rgb(0 0 0 / 0.08)' }}>
                  <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: '#6c5ce7' }} />
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-sm mb-1" style={{ color: 'hsl(var(--foreground))' }}>{article.title}</h3>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>{article.category}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white capitalize" style={{ background: statusColors[article.status] }}>{article.status}</span>
                  </div>
                  <p className="text-xs mb-3 line-clamp-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{article.content}</p>
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {article.tags.slice(0, 3).map((tag, j) => (
                        <span key={j} className="px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}><Tag className="w-2.5 h-2.5" />{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'hsl(var(--border) / 0.3)' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] flex items-center gap-1" style={{ color: 'hsl(var(--muted-foreground))' }}><Eye className="w-3 h-3" /> {article.views}</span>
                      <span className="text-[10px] flex items-center gap-1" style={{ color: 'hsl(var(--muted-foreground))' }}><ThumbsUp className="w-3 h-3" /> {article.helpful}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${visColors[article.visibility]}20`, color: visColors[article.visibility] }}>{article.visibility}</span>
                    </div>
                    <select value={article.status} onChange={(e) => updateStatus(article.id, e.target.value)}
                      className="text-[10px] font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer" style={{ background: 'hsl(var(--muted))', color: statusColors[article.status] }}>
                      <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
                    </select>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}
                className="w-full max-w-md p-6 rounded-2xl"
                style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)', boxShadow: '0 20px 60px -10px rgb(0 0 0 / 0.3)' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>New Article</h2>
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:opacity-70"><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input required placeholder="Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  <textarea required placeholder="Content *" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" rows={5} />
                  <div className="grid grid-cols-2 gap-3">
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm">
                      <option value="General">General</option><option value="Product">Product</option><option value="HR">HR</option><option value="IT">IT</option><option value="Finance">Finance</option><option value="Operations">Operations</option>
                    </select>
                    <select value={form.visibility} onChange={e => setForm({ ...form, visibility: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm">
                      <option value="internal">Internal</option><option value="public">Public</option>
                    </select>
                  </div>
                  <input placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>Create Article</button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
