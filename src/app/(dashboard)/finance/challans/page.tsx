'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Truck, Package, Search, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface Challan {
  id: string;
  challanNumber: string;
  customerName: string;
  customerAddress?: string;
  customerGst?: string;
  items: Record<string, unknown>[];
  subtotal?: number;
  taxTotal?: number;
  totalAmount?: number;
  status: string;
  deliveryDate?: string;
  vehicleNo?: string;
  supplyType?: string;
  createdAt: string;
}

export default function ChallansPage() {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerGst, setCustomerGst] = useState('');
  const [customerState, setCustomerState] = useState('');
  const [supplyType, setSupplyType] = useState<'intra' | 'inter'>('intra');
  const [vehicleNo, setVehicleNo] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<{ productName: string; quantity: string; price: string; gstRate: string; hsnCode: string }[]>([
    { productName: '', quantity: '1', price: '', gstRate: '18', hsnCode: '' }
  ]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/delivery-challans');
      if (res.ok) setChallans(await res.json());
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/delivery-challans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName, customerAddress, customerGst, customerState,
          supplyType, vehicleNo, notes,
          items: items.map(i => ({
            productName: i.productName,
            quantity: parseFloat(i.quantity) || 0,
            price: parseFloat(i.price) || 0,
            gstRate: parseFloat(i.gstRate) || 18,
            hsnCode: i.hsnCode,
          })).filter(i => i.productName),
        }),
      });
      if (res.ok) {
        setToast({ message: 'Challan created!', type: 'success' });
        setShowForm(false);
        resetForm();
        fetchData();
      }
    } catch {
      setToast({ message: 'Failed to create challan', type: 'error' });
    }
    setTimeout(() => setToast(null), 3000);
  };

  const resetForm = () => {
    setCustomerName(''); setCustomerAddress(''); setCustomerGst(''); setCustomerState('');
    setVehicleNo(''); setNotes('');
    setItems([{ productName: '', quantity: '1', price: '', gstRate: '18', hsnCode: '' }]);
  };

  const filtered = challans.filter(c =>
    (c.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.challanNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputStyle = { background: 'hsl(var(--card-bg))', border: '1px solid hsl(var(--border) / 0.5)', color: 'hsl(var(--foreground))' };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3" style={{ color: 'hsl(var(--foreground))' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
                <Truck className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
              </div>
              Delivery Challans
            </h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Create delivery challans for goods transport
            </p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))', boxShadow: '0 10px 30px -10px hsl(var(--primary) / 0.4)' }}>
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'New Challan'}
          </button>
        </div>

        {/* Create Form */}
        <AnimatePresence>
          {showForm && (
            <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSubmit} className="glass-card p-6 space-y-4 overflow-hidden">
              <h3 className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>New Delivery Challan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Customer *</label>
                  <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} required
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} placeholder="Customer name" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>GSTIN</label>
                  <input type="text" value={customerGst} onChange={e => setCustomerGst(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} placeholder="GST Number" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>State</label>
                  <input type="text" value={customerState} onChange={e => setCustomerState(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} placeholder="State" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Address</label>
                  <input type="text" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} placeholder="Address" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Vehicle No</label>
                  <input type="text" value={vehicleNo} onChange={e => setVehicleNo(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} placeholder="MH 01 AB 1234" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Supply Type</label>
                  <select value={supplyType} onChange={e => setSupplyType(e.target.value as 'intra' | 'inter')}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle}>
                    <option value="intra">Intra-State</option>
                    <option value="inter">Inter-State</option>
                  </select>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Items</label>
                  <button type="button" onClick={() => setItems([...items, { productName: '', quantity: '1', price: '', gstRate: '18', hsnCode: '' }])}
                    className="text-xs px-3 py-1 rounded-lg" style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                    + Add Item
                  </button>
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-5 gap-2 mb-2">
                    <input type="text" value={item.productName} onChange={e => { const n = [...items]; n[idx].productName = e.target.value; setItems(n); }}
                      className="col-span-2 px-3 py-2 rounded-lg text-xs focus:outline-none" style={inputStyle} placeholder="Product name" />
                    <input type="text" value={item.hsnCode} onChange={e => { const n = [...items]; n[idx].hsnCode = e.target.value; setItems(n); }}
                      className="px-3 py-2 rounded-lg text-xs focus:outline-none" style={inputStyle} placeholder="HSN" />
                    <input type="number" value={item.quantity} onChange={e => { const n = [...items]; n[idx].quantity = e.target.value; setItems(n); }}
                      className="px-3 py-2 rounded-lg text-xs focus:outline-none" style={inputStyle} placeholder="Qty" />
                    <div className="flex gap-1">
                      <input type="number" value={item.price} onChange={e => { const n = [...items]; n[idx].price = e.target.value; setItems(n); }}
                        className="flex-1 px-2 py-2 rounded-lg text-xs focus:outline-none" style={inputStyle} placeholder="Rate" />
                      {items.length > 1 && (
                        <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))}
                          className="p-1 rounded hover:bg-red-500/20"><X className="w-3 h-3 text-red-400" /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button type="submit"
                className="px-6 py-2.5 rounded-xl text-white text-sm font-medium"
                style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
                Create Challan
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Search */}
        <div className="glass-card p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <input type="text" placeholder="Search challans..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none" style={inputStyle} />
          </div>
        </div>

        {/* List */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto" style={{ borderColor: 'hsl(var(--border))', borderTopColor: 'hsl(var(--primary))' }} />
            </div>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'hsl(var(--muted))' }}>
                    <th className="text-left py-3 px-4 text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>Challan</th>
                    <th className="text-left py-3 px-4 text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>Customer</th>
                    <th className="text-right py-3 px-4 text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>Vehicle</th>
                    <th className="text-left py-3 px-4 text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <motion.tr key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="border-t hover:bg-[hsl(var(--muted))]" style={{ borderColor: 'hsl(var(--border))' }}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
                            <Package className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
                          </div>
                          <span className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{c.challanNumber}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm" style={{ color: 'hsl(var(--foreground))' }}>{c.customerName}</td>
                      <td className="py-3 px-4 text-right text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                        ₹{c.totalAmount?.toLocaleString('en-IN') || '0'}
                      </td>
                      <td className="py-3 px-4 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{c.vehicleNo || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize border ${
                          c.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' :
                          c.status === 'in-transit' ? 'bg-blue-500/20 text-blue-600 border-blue-500/30' :
                          'bg-gray-500/20 text-gray-600 border-gray-500/30'
                        }`}>{c.status}</span>
                      </td>
                      <td className="py-3 px-4 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {new Date(c.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Truck className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <h3 className="text-lg font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>No challans yet</h3>
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Create your first delivery challan</p>
            </div>
          )}
        </div>

        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-6 left-1/2 z-[100] flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl"
              style={{ background: toast.type === 'success' ? 'hsl(142 76% 36%)' : 'hsl(0 72% 51%)', color: 'white' }}>
              {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
