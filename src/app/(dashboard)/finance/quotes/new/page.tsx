'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Save, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface QuoteItem { description: string; quantity: string; rate: string; }

export default function NewQuotePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [clientName, setClientName] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [taxRate, setTaxRate] = useState('18');
  const [discountRate, setDiscountRate] = useState('0');
  const [items, setItems] = useState<QuoteItem[]>([{ description: '', quantity: '1', rate: '' }]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addItem = () => setItems(prev => [...prev, { description: '', quantity: '1', rate: '' }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, key: keyof QuoteItem, value: string) => setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [key]: value } : item));

  const subtotalAmt = items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.rate) || 0), 0);
  const taxAmt = subtotalAmt * (parseFloat(taxRate) || 0) / 100;
  const discountAmt = subtotalAmt * (parseFloat(discountRate) || 0) / 100;
  const totalAmt = subtotalAmt + taxAmt - discountAmt;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || items.length === 0 || !items[0].description) {
      showToast('Please fill client name and at least one item', 'error');
      return;
    }
    setSaving(true);
    try {
      const formattedItems = items.map(i => ({ description: i.description, quantity: parseFloat(i.quantity) || 0, rate: parseFloat(i.rate) || 0 }));
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName, validUntil, notes, tax: taxRate, discount: discountRate, items: formattedItems, subtotal: subtotalAmt, taxAmount: taxAmt, discountAmount: discountAmt, totalAmount: totalAmt }),
      });
      if (res.ok) {
        showToast('Quotation created successfully!');
        setTimeout(() => router.push('/finance/quotes'), 1000);
      } else {
        showToast('Failed to save quotation', 'error');
      }
    } catch {
      showToast('Failed to save quotation', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-4 lg:p-6" style={{ background: 'var(--page-gradient)' }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-black/5 transition-colors">
          <ArrowLeft size={20} style={{ color: 'var(--foreground)' }} />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>New Quotation</h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Create a price quotation for your client</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-4">
        {/* Client Info */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <FileText size={16} /> Client Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Client Name *</label>
              <input value={clientName} onChange={e => setClientName(e.target.value)} required placeholder="e.g. Rajesh Enterprises" className="glass-input w-full px-3 py-2.5 rounded-lg text-sm" style={{ color: 'var(--foreground)' }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Valid Until</label>
              <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="glass-input w-full px-3 py-2.5 rounded-lg text-sm" style={{ color: 'var(--foreground)' }} />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Items</h3>
            <button type="button" onClick={addItem} className="btn-secondary flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs">
              <Plus size={14} /> Add Item
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-12 md:col-span-5">
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Description</label>
                  <input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Item description" className="glass-input w-full px-3 py-2 rounded-lg text-sm" style={{ color: 'var(--foreground)' }} />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Qty</label>
                  <input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} min="1" className="glass-input w-full px-3 py-2 rounded-lg text-sm" style={{ color: 'var(--foreground)' }} />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Rate (₹)</label>
                  <input type="number" value={item.rate} onChange={e => updateItem(i, 'rate', e.target.value)} min="0" step="0.01" placeholder="0.00" className="glass-input w-full px-3 py-2 rounded-lg text-sm" style={{ color: 'var(--foreground)' }} />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Total</label>
                  <p className="px-3 py-2 text-sm font-medium" style={{ color: 'var(--foreground)' }}>₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)).toLocaleString('en-IN')}</p>
                </div>
                <div className="col-span-1 md:col-span-1 flex justify-end">
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="p-2 rounded-lg hover:bg-red-500/10">
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tax, Discount, Notes */}
        <div className="glass-card rounded-xl p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Tax Rate (%)</label>
              <select value={taxRate} onChange={e => setTaxRate(e.target.value)} className="glass-input w-full px-3 py-2.5 rounded-lg text-sm" style={{ color: 'var(--foreground)' }}>
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Discount (%)</label>
              <input type="number" value={discountRate} onChange={e => setDiscountRate(e.target.value)} min="0" max="100" className="glass-input w-full px-3 py-2.5 rounded-lg text-sm" style={{ color: 'var(--foreground)' }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Notes</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" className="glass-input w-full px-3 py-2.5 rounded-lg text-sm" style={{ color: 'var(--foreground)' }} />
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--muted-foreground)' }}>Subtotal</span><span style={{ color: 'var(--foreground)' }}>₹{subtotalAmt.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--muted-foreground)' }}>Tax ({taxRate}%)</span><span style={{ color: 'var(--foreground)' }}>₹{taxAmt.toLocaleString('en-IN')}</span></div>
                {discountAmt > 0 && <div className="flex justify-between text-sm"><span style={{ color: 'var(--muted-foreground)' }}>Discount ({discountRate}%)</span><span style={{ color: '#EF4444' }}>-₹{discountAmt.toLocaleString('en-IN')}</span></div>}
                <div className="flex justify-between text-lg font-bold pt-2 border-t" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}><span>Total</span><span>{totalAmt.toLocaleString('en-IN')}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium">
            {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : <><Save size={16} /> Create Quotation</>}
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
