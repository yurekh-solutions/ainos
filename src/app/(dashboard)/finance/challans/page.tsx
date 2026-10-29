'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Truck, Package, Search, X, Eye, Copy, ExternalLink, Save, AlertTriangle, CheckCircle2, Route, Loader2 } from 'lucide-react';
import { useToast } from '@/lib/toast';

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
  const { toast } = useToast();
  const { error: toastError } = toast;
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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
      toastError('Failed to load challans');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

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
        toast.success('Challan created!');
        setShowForm(false);
        resetForm();
        fetchData();
      } else {
        toast.error('Failed to create challan');
      }
    } catch {
      toast.error('Failed to create challan');
    }
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

        {challans.length > 0 && <EwayBillPanel challans={challans} />}

      </div>
    </div>
  );
}

// ── E-Way Bill panel ─────────────────────────────────────────────────────────
interface EwbPreview {
  challan: { id: string; number: string; customerName: string; goodsValue: number; invoiceId: string | null };
  requiresEwb: boolean; threshold: number; ready: boolean; errors: string[];
  payload: {
    partA: {
      fromCompanyGSTIN: string; toCompanyGSTIN: string; fromState: string; toState: string;
      totalValue: number; otherDocumentNumber: string;
      itemDetails: Array<{ productAsDesc: string; hsnCode: string; quantity: number; baseUnit: string; taxableAmountAndRate: { taxableAmount: number; gstRate: number } }>;
    };
    partB: { vehicleNumber: string; transportDocNumber: string };
  };
}
interface SavedEwb { ewbNo: string; validTill: string | null; persistedInvoiceId: string | null; message: string }

const MODES = [{ v: '1', l: 'Road' }, { v: '2', l: 'Rail' }, { v: '3', l: 'Air' }, { v: '4', l: 'Ship' }];
const NICED_URL = 'https://ewaybill gst.gov.in/ewbn/Default.aspx';

function EwayBillPanel({ challans }: { challans: Challan[] }) {
  const [challanId, setChallanId] = useState('');
  const activeChallanId = challanId || challans[0]?.id || '';
  const [distance, setDistance] = useState('');
  const [transportMode, setTransportMode] = useState('1');
  const [fromPin, setFromPin] = useState('');
  const [toPin, setToPin] = useState('');
  const [hazardous, setHazardous] = useState(false);
  const [preview, setPreview] = useState<EwbPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ewbNo, setEwbNo] = useState('');
  const [validTill, setValidTill] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<SavedEwb | null>(null);
  const [error, setError] = useState('');

  const clearOutputs = () => { setPreview(null); setSaved(null); setCopied(false); setError(''); };

  const doPreview = async () => {
    if (!activeChallanId) return;
    clearOutputs(); setLoadingPreview(true);
    try {
      const res = await fetch(`/api/delivery-challans/ewaybill?challanId=${activeChallanId}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Could not build preview'); return; }
      setPreview(data);
    } catch { setError('Preview request failed'); }
    finally { setLoadingPreview(false); }
  };

  const buildWorksheet = (): string => {
    if (!preview) return '';
    const a = preview.payload.partA;
    const mode = MODES.find(m => m.v === transportMode)?.l ?? transportMode;
    return [
      `E-Way Bill worksheet — Challan ${a.otherDocumentNumber}`,
      `Supply: ${a.fromState || '—'} → ${a.toState || '—'}   Transport: ${mode}${distance ? ` · ${distance} km` : ''}`,
      `From GSTIN: ${a.fromCompanyGSTIN || '—'}${fromPin ? `   PIN: ${fromPin}` : ''}`,
      `To GSTIN: ${a.toCompanyGSTIN || 'UNREG'}   To: ${preview.challan.customerName}${toPin ? `   PIN: ${toPin}` : ''}`,
      `Doc Type: CHL   Consignment value: ₹${a.totalValue.toLocaleString('en-IN')}${hazardous ? '   [Hazardous]' : ''}`,
      `Items:`,
      ...a.itemDetails.map((it, i) => `  ${i + 1}. ${it.productAsDesc} | HSN ${it.hsnCode || '—'} | Qty ${it.quantity} ${it.baseUnit} | Taxable ₹${it.taxableAmountAndRate.taxableAmount.toLocaleString('en-IN')} @ ${it.taxableAmountAndRate.gstRate}%`),
      ``,
      `Submit on the free portal: ${NICED_URL}`,
    ].join('\n');
  };

  const copyDetails = async () => {
    const text = buildWorksheet();
    if (!text) return;
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { setError('Could not copy to clipboard'); }
  };

  const openPortal = () => { window.open(NICED_URL, '_blank', 'noopener'); };

  const record = async () => {
    if (!activeChallanId) return;
    setError(''); setSaving(true); setSaved(null);
    try {
      const res = await fetch('/api/delivery-challans/ewaybill', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challanId: activeChallanId, ewbNo, validTill: validTill || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Could not record EWB'); return; }
      setSaved(data); setEwbNo(''); setValidTill('');
    } catch { setError('Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
          <Route className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
        </div>
        <h3 className="font-semibold text-lg" style={{ color: 'hsl(var(--foreground))' }}>E-Way Bill — Free Portal Assist</h3>
      </div>
      <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
        Prepare the details here, file them on the government NICeW portal (no fee), then record the real
        12-digit EWB number back. Needed when the consignment value exceeds
        ₹{(preview?.threshold ?? 50000).toLocaleString('en-IN')} (excluding GST).
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Challan *</label>
          <select value={activeChallanId} onChange={e => { setChallanId(e.target.value); clearOutputs(); }}
            className="glass-input rounded-xl px-4 py-2.5 text-sm w-full">
            {challans.map(c => <option key={c.id} value={c.id}>{c.challanNumber} · {c.customerName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Transport Mode</label>
          <select value={transportMode} onChange={e => setTransportMode(e.target.value)} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full">
            {MODES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Distance (km)</label>
          <input type="number" min="1" value={distance} onChange={e => setDistance(e.target.value)}
            className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" placeholder="e.g. 250" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>From Pincode</label>
          <input type="text" inputMode="numeric" maxLength={6} value={fromPin} onChange={e => setFromPin(e.target.value.replace(/\D/g, ''))}
            className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" placeholder="400001" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>To Pincode</label>
          <input type="text" inputMode="numeric" maxLength={6} value={toPin} onChange={e => setToPin(e.target.value.replace(/\D/g, ''))}
            className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" placeholder="110001" />
        </div>
        <label className="flex items-center gap-2 self-end pb-2.5 cursor-pointer select-none">
          <input type="checkbox" checked={hazardous} onChange={e => setHazardous(e.target.checked)} className="w-4 h-4 accent-[hsl(var(--primary))]" />
          <span className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>Hazardous goods</span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button onClick={doPreview} disabled={loadingPreview || saving}
          className="btn-secondary rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2">
          {loadingPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />} Check readiness
        </button>
        {preview && (
          <>
            <button onClick={copyDetails}
              className="btn-secondary rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2">
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy details'}
            </button>
            <button onClick={openPortal}
              className="btn-secondary rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2">
              <ExternalLink className="w-4 h-4" /> Open NICeW portal
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm rounded-xl p-3 mb-3 bg-red-500/10 border border-red-500/30">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <span style={{ color: 'hsl(var(--foreground))' }}>{error}</span>
        </div>
      )}

      {preview && (
        <div className="rounded-xl p-4 mb-3 space-y-2" style={{ background: 'hsl(var(--secondary))' }}>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{preview.challan.number}</span>
            <span style={{ color: 'hsl(var(--muted-foreground))' }}>· value ₹{preview.challan.goodsValue.toLocaleString('en-IN')}</span>
            {preview.requiresEwb
              ? <Badge tone="amber">EWB required</Badge>
              : <Badge tone="gray">Below ₹{preview.threshold.toLocaleString('en-IN')} · optional</Badge>}
            {preview.ready
              ? <Badge tone="emerald">Ready to file</Badge>
              : <Badge tone="red">Needs fixing</Badge>}
          </div>
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Route: state {preview.payload.partA.fromState || '—'} → {preview.payload.partA.toState || '—'} · {preview.payload.partA.itemDetails.length} item(s)
          </p>
          {preview.errors.length > 0 && (
            <ul className="text-xs space-y-0.5">
              {preview.errors.map((e, i) => <li key={i} style={{ color: 'hsl(var(--muted-foreground))' }}>• {e}</li>)}
            </ul>
          )}
          <details className="text-xs">
            <summary className="cursor-pointer" style={{ color: 'hsl(var(--primary))' }}>View portal worksheet</summary>
            <pre className="mt-2 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap" style={{ background: 'hsl(var(--card-bg))', color: 'hsl(var(--muted-foreground))' }}>{buildWorksheet()}</pre>
          </details>
        </div>
      )}

      <div className="rounded-xl p-4 space-y-3" style={{ background: 'hsl(var(--secondary))' }}>
        <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Record the EWB you generated on the portal</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>EWB Number (12 digits) *</label>
            <input type="text" inputMode="numeric" maxLength={12} value={ewbNo}
              onChange={e => setEwbNo(e.target.value.replace(/\D/g, '').slice(0, 12))}
              className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" placeholder="e.g. 123456789012" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Valid Till (optional)</label>
            <input type="date" value={validTill} onChange={e => setValidTill(e.target.value)}
              className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" />
          </div>
        </div>
        <button onClick={record} disabled={saving || ewbNo.length !== 12}
          className="btn-primary rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save EWB number
        </button>
      </div>

      {saved && (
        <div className="rounded-xl p-4 mt-3 space-y-2 border" style={{ borderColor: 'hsl(var(--primary) / 0.3)', background: 'hsl(var(--primary) / 0.05)' }}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>E-Way Bill recorded</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <EwbStat label="EWB Number" value={saved.ewbNo} />
            <EwbStat label="Valid Till" value={saved.validTill ? new Date(saved.validTill).toLocaleString('en-IN', { dateStyle: 'medium' }) : '—'} />
          </div>
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{saved.message}</p>
        </div>
      )}
    </motion.div>
  );
}

function Badge({ tone, children }: { tone: 'emerald' | 'red' | 'amber' | 'gray'; children: React.ReactNode }) {
  const cls: Record<string, string> = {
    emerald: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30',
    red: 'bg-red-500/20 text-red-600 border-red-500/30',
    amber: 'bg-amber-500/20 text-amber-600 border-amber-500/30',
    gray: 'bg-gray-500/20 text-gray-600 border-gray-500/30',
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${cls[tone]}`}>{children}</span>;
}

function EwbStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl" style={{ background: 'hsl(var(--card-bg))' }}>
      <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</p>
      <p className="text-base font-bold" style={{ color: 'hsl(var(--foreground))' }}>{value}</p>
    </div>
  );
}
