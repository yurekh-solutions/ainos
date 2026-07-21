'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, FileText, Eye, Calendar } from 'lucide-react';

interface BlogPost { _id: string; title: string; slug: string; content: string; status: string; author?: string; publishedAt?: string; views?: number; }

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', author: '', tags: '' });

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    try { const res = await fetch('/api/blog-posts'); if (res.ok) setPosts(await res.json()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/blog-posts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), status: 'draft' }),
      });
      if (res.ok) { setForm({ title: '', content: '', author: '', tags: '' }); setShowForm(false); fetchPosts(); }
    } catch (e) { console.error(e); }
  };

  const statusColors: Record<string, string> = { draft: '#94a3b8', published: '#34d399', scheduled: '#a78bfa' };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-[1400px] mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div><h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Blog Posts</h1><p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Content marketing</p></div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))', boxShadow: '0 8px 24px -6px hsl(var(--primary) / 0.4)' }}>
            <Plus className="w-4 h-4" /> New Post
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[{ l: 'Total Posts', v: posts.length, c: 'hsl(var(--primary))' },
            { l: 'Published', v: posts.filter(p => p.status === 'published').length, c: '#34d399' },
            { l: 'Drafts', v: posts.filter(p => p.status === 'draft').length, c: '#a78bfa' },
            { l: 'Total Views', v: posts.reduce((s, p) => s + (p.views || 0), 0).toLocaleString(), c: '#34d399' }].map((s, i) => (
            <motion.div key={s.l} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card p-5 rounded-2xl">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.l}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: s.c }}>{s.v}</p>
            </motion.div>
          ))}
        </div>

        {loading ? <div className="text-center py-20" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
          : posts.length === 0 ? (
            <div className="text-center py-20"><FileText className="w-12 h-12 mx-auto mb-3" style={{ color: 'hsl(var(--primary) / 0.3)' }} /><p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>No blog posts yet</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post, i) => (
                <motion.div key={post._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass-card p-5 rounded-2xl">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold line-clamp-2" style={{ color: 'hsl(var(--foreground))' }}>{post.title}</h3>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white capitalize flex-shrink-0 ml-2" style={{ background: statusColors[post.status] }}>{post.status}</span>
                  </div>
                  <p className="text-xs line-clamp-2 mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{post.content?.substring(0, 100)}...</p>
                  <div className="space-y-1.5">
                    {post.author && <p className="text-xs" style={{ color: '#94a3b8' }}>By {post.author}</p>}
                    {post.publishedAt && <p className="text-xs flex items-center gap-1" style={{ color: '#94a3b8' }}><Calendar className="w-3 h-3" />{new Date(post.publishedAt).toLocaleDateString()}</p>}
                    {post.views !== undefined && <p className="text-xs flex items-center gap-1" style={{ color: '#94a3b8' }}><Eye className="w-3 h-3" />{post.views} views</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}
              className="glass-card rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>New Blog Post</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:opacity-70"><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input required placeholder="Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                <textarea required placeholder="Content *" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={8}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                <input placeholder="Author" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                <input placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>Create Post</button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
