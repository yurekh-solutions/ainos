'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, FileText, Edit2, Trash2, Home, Globe, X } from 'lucide-react';

interface PageItem { id: string; title: string; slug: string; status: string; isHome: boolean; seoTitle?: string; seoDesc?: string; createdAt: string; }

export default function WebsitePagesPage() {
  const params = useParams();
  const router = useRouter();
  const websiteId = params.id as string;
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', slug: '', seoTitle: '', seoDesc: '' });

  const fetchPages = useCallback(async () => {
    try { const res = await fetch(`/api/websites/pages?websiteId=${websiteId}`); if (res.ok) setPages(await res.json()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [websiteId]);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        const res = await fetch(`/api/websites/pages?id=${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        if (res.ok) { resetForm(); fetchPages(); }
      } else {
        const res = await fetch('/api/websites/pages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, websiteId }) });
        if (res.ok) { resetForm(); fetchPages(); }
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this page?')) return;
    try { const res = await fetch(`/api/websites/pages?id=${id}`, { method: 'DELETE' }); if (res.ok) fetchPages(); } catch (e) { console.error(e); }
  };

  const handleEdit = (p: PageItem) => { setForm({ title: p.title, slug: p.slug, seoTitle: p.seoTitle || '', seoDesc: p.seoDesc || '' }); setEditId(p.id); setShowForm(true); };
  const resetForm = () => { setForm({ title: '', slug: '', seoTitle: '', seoDesc: '' }); setEditId(null); setShowForm(false); };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.push('/websites')} className="p-1.5 rounded-lg hover:bg-white/10"><ArrowLeft className="w-5 h-5" style={{ color: 'hsl(var(--foreground))' }} /></button>
          <div className="flex-1"><h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Pages</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{pages.length} pages</p></div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium" style={{ background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' }}>
            <Plus className="w-4 h-4" /> New Page
          </motion.button>
        </div>

        {loading ? <p className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</p> :
          <div className="space-y-2">
            {pages.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 rounded-xl p-4 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                <div className="p-2 rounded-lg" style={{ background: '#6D28D920' }}><FileText className="w-5 h-5" style={{ color: '#8B5CF6' }} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><p className="font-medium text-sm truncate" style={{ color: 'hsl(var(--foreground))' }}>{p.title}</p>
                    {p.isHome && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: '#10b98120', color: '#10b981' }}>Home</span>}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: p.status === 'published' ? '#10b98120' : '#f59e0b20', color: p.status === 'published' ? '#10b981' : '#f59e0b' }}>{p.status}</span></div>
                  <p className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>/{p.slug}</p>
                </div>
                <div className="flex items-center gap-1">
                  <a href={`/websites/builder/${websiteId}`} className="p-1.5 rounded-lg hover:bg-white/10"><Edit2 className="w-4 h-4" style={{ color: '#8B5CF6' }} /></a>
                  <button onClick={() => handleEdit(p)} className="p-1.5 rounded-lg hover:bg-white/10"><Globe className="w-4 h-4" style={{ color: '#6b7280' }} /></button>
                  {!p.isHome && <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-white/10"><Trash2 className="w-4 h-4" style={{ color: '#ef4444' }} /></button>}
                </div>
              </motion.div>))}
          </div>}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-xl p-6 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{editId ? 'Edit' : 'New'} Page</h2>
                <button onClick={() => setShowForm(false)}><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button></div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Title</label>
                  <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
                <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Slug</label>
                  <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated from title" className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
                <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>SEO Title</label>
                  <input value={form.seoTitle} onChange={e => setForm({ ...form, seoTitle: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
                <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>SEO Description</label>
                  <textarea value={form.seoDesc} onChange={e => setForm({ ...form, seoDesc: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
                <button type="submit" className="w-full py-2.5 rounded-lg text-white text-sm font-medium" style={{ background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' }}>{editId ? 'Update' : 'Create'} Page</button>
              </form>
            </motion.div>
          </div>)}
      </motion.div>
    </div>
  );
}
