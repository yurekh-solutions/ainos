'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Globe, Search, X, Edit2, Trash2, ExternalLink, FileText, Eye } from 'lucide-react';

interface Website { id: string; name: string; description?: string; domain?: string; subdomain?: string; status: string; template?: string; _count?: { pages: number; forms: number }; createdAt: string; }

export default function WebsitesPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', template: 'default' });

  const fetchWebsites = useCallback(async () => {
    try { const res = await fetch('/api/websites'); if (res.ok) setWebsites(await res.json()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchWebsites(); }, [fetchWebsites]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editId ? `/api/websites?id=${editId}` : '/api/websites';
      const res = await fetch(url, { method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { resetForm(); fetchWebsites(); }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this website and all its pages?')) return;
    try { const res = await fetch(`/api/websites?id=${id}`, { method: 'DELETE' }); if (res.ok) fetchWebsites(); } catch (e) { console.error(e); }
  };

  const handleEdit = (w: Website) => { setForm({ name: w.name, description: w.description || '', template: w.template || 'default' }); setEditId(w.id); setShowForm(true); };
  const resetForm = () => { setForm({ name: '', description: '', template: 'default' }); setEditId(null); setShowForm(false); };
  const filtered = websites.filter(w => w.name?.toLowerCase().includes(search.toLowerCase()));

  const STATUS_COLORS: Record<string, string> = { draft: '#f59e0b', published: '#10b981', suspended: '#ef4444' };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div><h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Websites</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{websites.length} websites</p></div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium" style={{ background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' }}>
            <Plus className="w-4 h-4" /> New Website
          </motion.button>
        </div>

        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search websites..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>

        {loading ? <p className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</p> :
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((w, i) => (
              <motion.div key={w.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-xl p-5 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg" style={{ background: '#6D28D920' }}><Globe className="w-5 h-5" style={{ color: '#8B5CF6' }} /></div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: (STATUS_COLORS[w.status] || '#6b7280') + '20', color: STATUS_COLORS[w.status] || '#6b7280' }}>{w.status}</span>
                </div>
                <h3 className="font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>{w.name}</h3>
                <p className="text-xs mb-3 line-clamp-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{w.description || 'No description'}</p>
                <div className="flex items-center gap-3 text-xs mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {w._count?.pages || 0} pages</span>
                  <span>{w.domain || `${w.subdomain}.ainos.io`}</span>
                </div>
                <div className="flex items-center gap-1 pt-3 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                  <a href={`/websites/builder/${w.id}`} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium hover:bg-white/10 transition-colors" style={{ color: '#8B5CF6' }}><Edit2 className="w-3 h-3" /> Builder</a>
                  <a href={`/websites/pages/${w.id}`} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium hover:bg-white/10 transition-colors" style={{ color: 'hsl(var(--foreground))' }}><FileText className="w-3 h-3" /> Pages</a>
                  <button onClick={() => handleEdit(w)} className="p-1.5 rounded-lg hover:bg-white/10"><Edit2 className="w-3.5 h-3.5" style={{ color: '#8B5CF6' }} /></button>
                  <button onClick={() => handleDelete(w.id)} className="p-1.5 rounded-lg hover:bg-white/10"><Trash2 className="w-3.5 h-3.5" style={{ color: '#ef4444' }} /></button>
                </div>
              </motion.div>))}
          </div>}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-xl p-6 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{editId ? 'Edit' : 'New'} Website</h2>
                <button onClick={() => setShowForm(false)}><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button></div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Website Name</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
                <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
                <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Template</label>
                  <select value={form.template} onChange={e => setForm({ ...form, template: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
                    <option value="default">Default</option><option value="portfolio">Portfolio</option><option value="business">Business</option><option value="blog">Blog</option><option value="landing">Landing Page</option>
                  </select></div>
                <button type="submit" className="w-full py-2.5 rounded-lg text-white text-sm font-medium" style={{ background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' }}>{editId ? 'Update' : 'Create'} Website</button>
              </form>
            </motion.div>
          </div>)}
      </motion.div>
    </div>
  );
}
