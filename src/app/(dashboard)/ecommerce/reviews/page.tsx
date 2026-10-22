'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star, Search, X, Check, Trash2, MessageSquare } from 'lucide-react';

interface Review { id: string; productId: string; rating: number; title?: string; comment?: string; authorName?: string; isApproved: boolean; createdAt: string; product?: { name: string }; }

export default function EcomReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchReviews = useCallback(async () => {
    try { const url = filter ? `/api/ecommerce/reviews?approved=${filter}` : '/api/ecommerce/reviews'; const res = await fetch(url); if (res.ok) setReviews(await res.json()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const toggleApprove = async (id: string, isApproved: boolean) => {
    try { const res = await fetch(`/api/ecommerce/reviews?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isApproved: !isApproved }) }); if (res.ok) fetchReviews(); } catch (e) { console.error(e); }
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return;
    try { const res = await fetch(`/api/ecommerce/reviews?id=${id}`, { method: 'DELETE' }); if (res.ok) fetchReviews(); } catch (e) { console.error(e); }
  };

  const avgRating = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : '0';
  const pendingCount = reviews.filter(r => !r.isApproved).length;

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6">
        <div><h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Reviews</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{reviews.length} reviews</p></div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[{ label: 'Total Reviews', value: reviews.length, icon: MessageSquare, color: '#6D28D9' },
            { label: 'Avg Rating', value: `${avgRating} ★`, icon: Star, color: '#f59e0b' },
            { label: 'Pending', value: pendingCount, icon: Star, color: '#ef4444' }].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="rounded-xl p-4 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <div className="flex items-center gap-3"><div className="p-2 rounded-lg" style={{ background: s.color + '20' }}><s.icon className="w-5 h-5" style={{ color: s.color }} /></div>
                <div><p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.label}</p><p className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{s.value}</p></div></div>
            </motion.div>))}
        </div>

        <select value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-2.5 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
          <option value="">All Reviews</option><option value="true">Approved</option><option value="false">Pending</option>
        </select>

        {loading ? <p className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</p> :
          <div className="space-y-3">
            {reviews.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="rounded-xl p-4 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex">{[1,2,3,4,5].map(n => <Star key={n} className="w-4 h-4" style={{ color: n <= r.rating ? '#f59e0b' : '#374151', fill: n <= r.rating ? '#f59e0b' : 'none' }} />)}</div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: r.isApproved ? '#10b98120' : '#f59e0b20', color: r.isApproved ? '#10b981' : '#f59e0b' }}>{r.isApproved ? 'Approved' : 'Pending'}</span>
                    </div>
                    <p className="font-medium text-sm" style={{ color: 'hsl(var(--foreground))' }}>{r.title || 'No title'}</p>
                    <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{r.comment || 'No comment'}</p>
                    <p className="text-xs mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>by {r.authorName || 'Anonymous'} on {r.product?.name || 'Product'} • {new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-1 ml-3">
                    <button onClick={() => toggleApprove(r.id, r.isApproved)} className="p-1.5 rounded hover:bg-white/10"><Check className="w-4 h-4" style={{ color: '#10b981' }} /></button>
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded hover:bg-white/10"><Trash2 className="w-4 h-4" style={{ color: '#ef4444' }} /></button>
                  </div>
                </div>
              </motion.div>))}
          </div>}
      </motion.div>
    </div>
  );
}
