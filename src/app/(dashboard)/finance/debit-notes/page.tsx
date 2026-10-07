'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Search } from 'lucide-react';
import Link from 'next/link';

export default function DebitNotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/debit-notes').then(r => r.ok ? r.json() : []).then(setNotes).catch(() => {});
  }, []);

  const filtered = notes.filter(n => n.noteNumber?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen p-6 sm:p-8" style={{ background: 'hsl(var(--page-gradient))' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Debit Notes</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Manage debit notes for vendors</p>
          </div>
          <Link href="/finance/debit-notes/new" className="btn-primary rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2"><Plus className="w-4 h-4" /> New Debit Note</Link>
        </div>

        <div className="glass-card rounded-2xl p-5 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <input type="text" placeholder="Search debit notes..." className="glass-input rounded-xl pl-10 pr-4 py-2.5 w-full text-sm" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                <th className="text-left p-4 text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>Number</th>
                <th className="text-left p-4 text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>Vendor</th>
                <th className="text-left p-4 text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>Amount</th>
                <th className="text-left p-4 text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>Status</th>
                <th className="text-left p-4 text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>Date</th>
              </tr></thead>
              <tbody>
                {filtered.map((note, i) => (
                  <motion.tr key={note.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b" style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
                    <td className="p-4 text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{note.noteNumber}</td>
                    <td className="p-4 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{note.vendorName || '-'}</td>
                    <td className="p-4 text-sm font-semibold text-red-600">₹{(note.total || 0).toLocaleString('en-IN')}</td>
                    <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${note.status === 'posted' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>{note.status}</span></td>
                    <td className="p-4 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{new Date(note.createdAt).toLocaleDateString('en-IN')}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-center py-12 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>No debit notes found</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
