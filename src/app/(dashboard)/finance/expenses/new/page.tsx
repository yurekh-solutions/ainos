'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, DollarSign, Save, CheckCircle2, AlertCircle } from 'lucide-react';

const categories = ['Travel', 'Food', 'Office Supplies', 'Software', 'Marketing', 'Utilities', 'Rent', 'Salary', 'Maintenance', 'Transport', 'Other'];

export default function NewExpensePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState({
    title: '', amount: '', category: 'Other', date: new Date().toISOString().split('T')[0],
    vendor: '', description: '', status: 'pending',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount) || 0,
        }),
      });
      if (res.ok) {
        showToast('Expense added successfully!');
        setTimeout(() => router.push('/finance/expenses'), 1000);
      } else {
        showToast('Failed to save expense', 'error');
      }
    } catch {
      showToast('Failed to save expense', 'error');
    } finally {
      setSaving(false);
    }
  };

  const update = (key: string, value: string) => setFormData(prev => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-screen p-4 lg:p-6" style={{ background: 'var(--page-gradient)' }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-black/5 transition-colors">
          <ArrowLeft size={20} style={{ color: 'var(--foreground)' }} />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Add New Expense</h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Record a business expense</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <DollarSign size={16} /> Expense Details
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Title *</label>
              <input value={formData.title} onChange={e => update('title', e.target.value)} required placeholder="e.g. Office supplies purchase" className="glass-input w-full px-3 py-2.5 rounded-lg text-sm" style={{ color: 'var(--foreground)' }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Amount (₹) *</label>
                <input type="number" value={formData.amount} onChange={e => update('amount', e.target.value)} required min="0" step="0.01" placeholder="0.00" className="glass-input w-full px-3 py-2.5 rounded-lg text-sm" style={{ color: 'var(--foreground)' }} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Category</label>
                <select value={formData.category} onChange={e => update('category', e.target.value)} className="glass-input w-full px-3 py-2.5 rounded-lg text-sm" style={{ color: 'var(--foreground)' }}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Date</label>
                <input type="date" value={formData.date} onChange={e => update('date', e.target.value)} className="glass-input w-full px-3 py-2.5 rounded-lg text-sm" style={{ color: 'var(--foreground)' }} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Vendor / Payee</label>
                <input value={formData.vendor} onChange={e => update('vendor', e.target.value)} placeholder="e.g. Amazon, Local store" className="glass-input w-full px-3 py-2.5 rounded-lg text-sm" style={{ color: 'var(--foreground)' }} />
              </div>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Description</label>
              <textarea value={formData.description} onChange={e => update('description', e.target.value)} rows={3} placeholder="Additional details..." className="glass-input w-full px-3 py-2.5 rounded-lg text-sm resize-none" style={{ color: 'var(--foreground)' }} />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium">
            {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : <><Save size={16} /> Save Expense</>}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary px-6 py-2.5 rounded-lg text-sm font-medium">Cancel</button>
        </div>
      </form>

      {toast && (
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl"
          style={{ background: toast.type === 'success' ? '#10B981' : '#EF4444', color: 'white' }}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </motion.div>
      )}
    </div>
  );
}
