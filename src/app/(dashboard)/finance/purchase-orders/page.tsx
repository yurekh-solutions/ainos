'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ShoppingCart, Package, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

interface POItem { description: string; quantity: string; rate: string; }
interface PurchaseOrder {
  id: string; poNumber: string; vendorName?: string; items?: POItem[];
  subtotal?: number; tax?: number; discount?: number; total?: number;
  status: string; orderDate?: string; expectedDate?: string; notes?: string;
}

const statusColors: Record<string, string> = {
  draft: '#94a3b8', pending: '#f59e0b', approved: '#3b82f6', received: '#10b981', cancelled: '#ef4444',
};

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [taxRate, setTaxRate] = useState('18');
  const [items, setItems] = useState<POItem[]>([{ description: '', quantity: '1', rate: '' }]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/purchase-orders');
      if (res.ok) setOrders(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const subtotal = items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.rate) || 0), 0);
  const taxAmt = subtotal * (parseFloat(taxRate) || 0) / 100;
  const total = subtotal + taxAmt;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName || items.length === 0) return;
    try {
      const formattedItems = items.map(i => ({ description: i.description, quantity: parseFloat(i.quantity) || 0, rate: parseFloat(i.rate) || 0 }));
      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorName, orderDate, expectedDate, notes, items: formattedItems, subtotal, tax: taxAmt, total, status: 'draft' }),
      });
      if (res.ok) {
        setToast({ message: 'Purchase Order created!', type: 'success' });
        setShowForm(false);
        setVendorName(''); setItems([{ description: '', quantity: '1', rate: '' }]); setNotes('');
        fetchOrders();
      } else {
        setToast({ message: 'Failed to create PO', type: 'error' });
      }
    } catch { setToast({ message: 'Network error', type: 'error' }); }
    setTimeout(() => setToast(null), 3000);
  };

  const addItem = () => setItems(prev => [...prev, { description: '', quantity: '1', rate: '' }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, key: keyof POItem, val: string) => setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [key]: val } : item));

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3" style={{ color: 'hsl(var(--foreground))' }}>
              <ShoppingCart className="w-8 h-8" style={{ color: 'hsl(var(--primary))' }} /> Purchase Orders
            </h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Manage vendor purchase orders</p>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
            <Plus className="w-4 h-4" /> New PO
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total POs', value: orders.length, color: 'hsl(var(--primary))' },
            { label: 'Draft', value: orders.filter(o => o.status === 'draft').length, color: '#94a3b8' },
            { label: 'Approved', value: orders.filter(o => o.status === 'approved').length, color: '#3b82f6' },
            { label: 'Total Value', value: `₹${orders.reduce((s, o) => s + (o.total || 0), 0).toLocaleString('en-IN')}`, color: '#10b981' },
          ].map((s, i) => (
            <div key={i} className="glass-card rounded-xl p-4">
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.label}</p>
              <p className="text-xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Orders List */}
        {loading ? <div className="text-center py-20" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
          : orders.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-12 h-12 mx-auto mb-3" style={{ color: 'hsl(var(--primary) / 0.3)' }} />
              <p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>No purchase orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((po, i) => (
                <motion.div key={po.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass-card rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{po.poNumber}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white capitalize"
                        style={{ background: statusColors[po.status] || '#94a3b8' }}>{po.status}</span>
                    </div>
                    <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{po.vendorName || 'No vendor'}</p>
                    {po.orderDate && <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Ordered: {new Date(po.orderDate).toLocaleDateString('en-IN')}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>₹{(po.total || 0).toLocaleString('en-IN')}</p>
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{Array.isArray(po.items) ? po.items.length : 0} items</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        {/* Create PO Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                className="glass-card rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>New Purchase Order</h2>
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:opacity-70"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Vendor Name *</label>
                      <input value={vendorName} onChange={e => setVendorName(e.target.value)} required placeholder="Vendor" className="glass-input w-full px-3 py-2.5 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Expected Delivery</label>
                      <input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} className="glass-input w-full px-3 py-2.5 rounded-xl text-sm" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Items</label>
                      <button type="button" onClick={addItem} className="text-xs px-2 py-1 rounded-lg" style={{ color: 'hsl(var(--primary))' }}>+ Add Item</button>
                    </div>
                    {items.map((item, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 mb-2">
                        <input className="glass-input col-span-6 px-3 py-2 rounded-lg text-sm" placeholder="Description" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} />
                        <input type="number" className="glass-input col-span-2 px-3 py-2 rounded-lg text-sm" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                        <input type="number" className="glass-input col-span-2 px-3 py-2 rounded-lg text-sm" placeholder="Rate" value={item.rate} onChange={e => updateItem(i, 'rate', e.target.value)} />
                        <div className="col-span-1 flex items-center">
                          <span className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)).toFixed(0)}</span>
                        </div>
                        <div className="col-span-1 flex items-center justify-end">
                          {items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="p-1 rounded-lg hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Tax Rate (%)</label>
                      <select value={taxRate} onChange={e => setTaxRate(e.target.value)} className="glass-input w-full px-3 py-2.5 rounded-xl text-sm">
                        <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option><option value="28">28%</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Notes</label>
                      <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" className="glass-input w-full px-3 py-2.5 rounded-xl text-sm" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="w-48 space-y-1 text-right">
                      <div className="flex justify-between text-sm"><span style={{ color: 'hsl(var(--muted-foreground))' }}>Subtotal</span><span style={{ color: 'hsl(var(--foreground))' }}>₹{subtotal.toFixed(2)}</span></div>
                      <div className="flex justify-between text-sm"><span style={{ color: 'hsl(var(--muted-foreground))' }}>Tax ({taxRate}%)</span><span style={{ color: 'hsl(var(--foreground))' }}>₹{taxAmt.toFixed(2)}</span></div>
                      <div className="flex justify-between text-lg font-bold pt-1 border-t" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}><span>Total</span><span>₹{total.toFixed(2)}</span></div>
                    </div>
                  </div>
                  <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>Create Purchase Order</button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl"
              style={{ background: toast.type === 'success' ? '#10B981' : '#EF4444', color: 'white' }}>
              {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
