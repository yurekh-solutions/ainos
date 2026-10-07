'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function NewCreditNotePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    customerName: '',
    invoiceId: '',
    reason: '',
    items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
  });

  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, rate: 0, amount: 0 }] });
  const removeItem = (i: number) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i: number, field: string, value: string | number) => {
    const items = [...form.items];
    (items[i] as Record<string, unknown>)[field] = value;
    if (field === 'quantity' || field === 'rate') {
      items[i].amount = (items[i].quantity || 0) * (items[i].rate || 0);
    }
    setForm({ ...form, items });
  };

  const subtotal = form.items.reduce((s, i) => s + (i.amount || 0), 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/credit-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, subtotal, tax, total }),
    });
    if (res.ok) router.push('/finance/credit-notes');
  };

  return (
    <div className="min-h-screen p-6 sm:p-8" style={{ background: 'hsl(var(--page-gradient))' }}>
      <div className="max-w-4xl mx-auto">
        <Link href="/finance/credit-notes" className="inline-flex items-center gap-2 text-sm mb-6 hover:opacity-80" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <ArrowLeft className="w-4 h-4" /> Back to Credit Notes
        </Link>

        <h1 className="text-2xl font-bold mb-6" style={{ color: 'hsl(var(--foreground))' }}>New Credit Note</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>Customer Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input className="glass-input rounded-xl px-4 py-2.5 text-sm" placeholder="Customer Name" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} required />
              <input className="glass-input rounded-xl px-4 py-2.5 text-sm" placeholder="Invoice ID (optional)" value={form.invoiceId} onChange={e => setForm({ ...form, invoiceId: e.target.value })} />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Items</h3>
              <button type="button" onClick={addItem} className="btn-primary rounded-xl px-3 py-1.5 text-xs font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add Item</button>
            </div>
            <div className="space-y-3">
              {form.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'hsl(var(--secondary))' }}>
                  <input className="glass-input rounded-lg px-3 py-2 text-sm flex-1" placeholder="Description" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} />
                  <input className="glass-input rounded-lg px-3 py-2 text-sm w-20" type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)} />
                  <input className="glass-input rounded-lg px-3 py-2 text-sm w-24" type="number" placeholder="Rate" value={item.rate} onChange={e => updateItem(i, 'rate', parseFloat(e.target.value) || 0)} />
                  <p className="text-sm font-medium w-24 text-right" style={{ color: 'hsl(var(--foreground))' }}>₹{(item.amount || 0).toLocaleString('en-IN')}</p>
                  {form.items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-500"><Trash2 className="w-4 h-4" /></button>}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>Reason</h3>
            <textarea className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" rows={3} placeholder="Reason for credit note..." value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span style={{ color: 'hsl(var(--muted-foreground))' }}>Subtotal</span><span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>₹{subtotal.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-sm"><span style={{ color: 'hsl(var(--muted-foreground))' }}>Tax (18%)</span><span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>₹{tax.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}><span>Total</span><span className="text-emerald-600">₹{total.toLocaleString('en-IN')}</span></div>
            </div>
          </div>

          <button type="submit" className="btn-primary rounded-xl px-6 py-3 text-sm font-medium w-full">Create Credit Note</button>
        </form>
      </div>
    </div>
  );
}
