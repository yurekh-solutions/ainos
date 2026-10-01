'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState({
    name: '', sku: '', hsnCode: '', price: '', costPrice: '', mrp: '',
    gstRate: '18', barcode: '', description: '', category: '',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          sku: formData.sku,
          hsnCode: formData.hsnCode,
          price: parseFloat(formData.price) || 0,
          costPrice: parseFloat(formData.costPrice) || 0,
          mrp: parseFloat(formData.mrp) || 0,
          gstRate: parseFloat(formData.gstRate) || 0,
          taxRate: parseFloat(formData.gstRate) || 0,
          barcode: formData.barcode,
          description: formData.description,
          category: formData.category,
          isActive: true,
        }),
      });
      if (res.ok) {
        showToast('Product created successfully!');
        setTimeout(() => router.push('/products'), 1000);
      } else {
        showToast('Failed to save product', 'error');
      }
    } catch {
      showToast('Failed to save product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const update = (key: string, value: string) => setFormData(prev => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-screen p-4 lg:p-6" style={{ background: 'var(--page-gradient)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-black/5 transition-colors">
          <ArrowLeft size={20} style={{ color: 'var(--foreground)' }} />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Add New Product</h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Add product to your catalog with GST details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-4">
        {/* Basic Info */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <Package size={16} /> Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Product Name *</label>
              <input value={formData.name} onChange={e => update('name', e.target.value)} required placeholder="Enter product name" className="glass-input w-full px-3 py-2.5 rounded-lg text-sm" style={{ color: 'var(--foreground)' }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>SKU</label>
              <input value={formData.sku} onChange={e => update('sku', e.target.value)} placeholder="e.g. PRD-001" className="glass-input w-full px-3 py-2.5 rounded-lg text-sm" style={{ color: 'var(--foreground)' }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Category</label>
              <input value={formData.category} onChange={e => update('category', e.target.value)} placeholder="e.g. Electronics" className="glass-input w-full px-3 py-2.5 rounded-lg text-sm" style={{ color: 'var(--foreground)' }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>HSN / SAC Code</label>
              <input value={formData.hsnCode} onChange={e => update('hsnCode', e.target.value)} placeholder="e.g. 998314" className="glass-input w-full px-3 py-2.5 rounded-lg text-sm" style={{ color: 'var(--foreground)' }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Barcode</label>
              <input value={formData.barcode} onChange={e => update('barcode', e.target.value)} placeholder="e.g. 8901234567890" className="glass-input w-full px-3 py-2.5 rounded-lg text-sm" style={{ color: 'var(--foreground)' }} />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Pricing & Tax</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Selling Price (₹) *</label>
              <input type="number" value={formData.price} onChange={e => update('price', e.target.value)} required min="0" step="0.01" placeholder="0.00" className="glass-input w-full px-3 py-2.5 rounded-lg text-sm" style={{ color: 'var(--foreground)' }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Cost Price (₹)</label>
              <input type="number" value={formData.costPrice} onChange={e => update('costPrice', e.target.value)} min="0" step="0.01" placeholder="0.00" className="glass-input w-full px-3 py-2.5 rounded-lg text-sm" style={{ color: 'var(--foreground)' }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>MRP (₹)</label>
              <input type="number" value={formData.mrp} onChange={e => update('mrp', e.target.value)} min="0" step="0.01" placeholder="0.00" className="glass-input w-full px-3 py-2.5 rounded-lg text-sm" style={{ color: 'var(--foreground)' }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>GST Rate</label>
              <select value={formData.gstRate} onChange={e => update('gstRate', e.target.value)} className="glass-input w-full px-3 py-2.5 rounded-lg text-sm" style={{ color: 'var(--foreground)' }}>
                <option value="0">0% — Nil rated</option>
                <option value="5">5% — Essential goods</option>
                <option value="12">12% — Processed food</option>
                <option value="18">18% — Most services</option>
                <option value="28">28% — Luxury items</option>
              </select>
            </div>
            {formData.price && formData.costPrice && (
              <div className="md:col-span-2 flex items-end">
                <div className="w-full p-3 rounded-lg" style={{ background: `${parseFloat(formData.price) >= parseFloat(formData.costPrice) ? '#10B981' : '#EF4444'}10`, border: `1px solid ${parseFloat(formData.price) >= parseFloat(formData.costPrice) ? '#10B981' : '#EF4444'}30` }}>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Estimated Profit per unit</p>
                  <p className="text-lg font-bold" style={{ color: parseFloat(formData.price) >= parseFloat(formData.costPrice) ? '#10B981' : '#EF4444' }}>
                    ₹{(parseFloat(formData.price) - parseFloat(formData.costPrice)).toFixed(2)}
                    <span className="text-xs ml-2">
                      ({(((parseFloat(formData.price) - parseFloat(formData.costPrice)) / parseFloat(formData.price)) * 100).toFixed(0)}% margin)
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Description</h3>
          <textarea value={formData.description} onChange={e => update('description', e.target.value)} rows={3} placeholder="Product description..." className="glass-input w-full px-3 py-2.5 rounded-lg text-sm resize-none" style={{ color: 'var(--foreground)' }} />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium">
            {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : <><Save size={16} /> Save Product</>}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary px-6 py-2.5 rounded-lg text-sm font-medium">Cancel</button>
        </div>
      </form>

      {/* Toast */}
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
