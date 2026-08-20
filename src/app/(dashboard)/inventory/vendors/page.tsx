'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Building2, Mail, Phone, Search, Star } from 'lucide-react';

interface Vendor { id: string; name: string; email: string; phone?: string; company?: string; category: string; status: string; gstin?: string; rating?: number; paymentTerms?: string; totalSpend?: number; createdAt: string; }

const statusColors: Record<string, string> = { active: '#00b894', inactive: '#636e72', blacklisted: '#d63031' };
const categoryColors: Record<string, string> = { supplier: '#6c5ce7', contractor: '#0984e3', service: '#00b894', other: '#636e72' };

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', category: 'supplier', gstin: '', paymentTerms: 'Net 30' });

  useEffect(() => { fetchVendors(); }, []);

  const fetchVendors = async () => {
    try { const res = await fetch('/api/vendors'); if (res.ok) setVendors(await res.json()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/vendors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, status: 'active' }) });
      if (res.ok) { setForm({ name: '', email: '', phone: '', company: '', category: 'supplier', gstin: '', paymentTerms: 'Net 30' }); setShowForm(false); fetchVendors(); }
    } catch (e) { console.error(e); }
  };

  const updateStatus = async (id: string, status: string) => {
    try { await fetch('/api/vendors', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) }); fetchVendors(); } catch (e) { console.error(e); }
  };

  const filtered = vendors.filter(v => {
    const matchSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.company?.toLowerCase().includes(searchTerm.toLowerCase()) || v.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === 'all' || v.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const stats = {
    total: vendors.length,
    active: vendors.filter(v => v.status === 'active').length,
    inactive: vendors.filter(v => v.status === 'inactive').length,
    totalSpend: vendors.reduce((s, v) => s + (v.totalSpend || 0), 0),
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Vendors</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Manage suppliers and vendor relationships</p>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)', boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)' }}>
            <Plus className="w-4 h-4" /> Add Vendor
          </motion.button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Vendors', value: stats.total, gradient: 'from-violet-500 to-purple-600' },
            { label: 'Active', value: stats.active, gradient: 'from-emerald-500 to-teal-600' },
            { label: 'Inactive', value: stats.inactive, gradient: 'from-gray-500 to-slate-600' },
            { label: 'Total Spend', value: `₹${stats.totalSpend.toLocaleString('en-IN')}`, gradient: 'from-amber-500 to-orange-600' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }} className="relative p-4 rounded-2xl"
              style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)', boxShadow: '0 4px 20px -4px rgb(0 0 0 / 0.08)' }}>
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${stat.gradient} rounded-l-2xl`} />
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{stat.label}</p>
              <p className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <input type="text" placeholder="Search vendors..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full glass-input pl-10 pr-4 py-2.5 text-sm" />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="glass-input px-4 py-2.5 text-sm rounded-xl">
            <option value="all">All Categories</option><option value="supplier">Supplier</option><option value="contractor">Contractor</option><option value="service">Service</option><option value="other">Other</option>
          </select>
        </div>

        {loading ? <div className="text-center py-20" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
          : filtered.length === 0 ? (
            <div className="text-center py-20 p-8 rounded-2xl" style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)' }}>
              <Building2 className="w-12 h-12 mx-auto mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <p style={{ color: 'hsl(var(--foreground))' }}>No vendors found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((vendor, i) => (
                <motion.div key={vendor.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -4 }} className="relative p-5 rounded-2xl group"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)', boxShadow: '0 4px 20px -4px rgb(0 0 0 / 0.08)' }}>
                  <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: categoryColors[vendor.category] || '#6c5ce7' }} />
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${categoryColors[vendor.category] || '#6c5ce7'}, ${categoryColors[vendor.category] || '#6c5ce7'}dd)` }}>
                        {vendor.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm" style={{ color: 'hsl(var(--foreground))' }}>{vendor.name}</p>
                        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{vendor.company || 'No company'}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white capitalize" style={{ background: statusColors[vendor.status] || '#636e72' }}>{vendor.status}</span>
                  </div>
                  <p className="text-xs mb-1 flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}><Mail className="w-3 h-3" /> {vendor.email}</p>
                  {vendor.phone && <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}><Phone className="w-3 h-3" /> {vendor.phone}</p>}
                  {vendor.gstin && <p className="text-xs mb-2 font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>GSTIN: {vendor.gstin}</p>}
                  <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'hsl(var(--border) / 0.3)' }}>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full capitalize" style={{ background: `${categoryColors[vendor.category]}20`, color: categoryColors[vendor.category] }}>{vendor.category}</span>
                    <select value={vendor.status} onChange={(e) => updateStatus(vendor.id, e.target.value)}
                      className="text-[10px] font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer" style={{ background: 'hsl(var(--muted))', color: statusColors[vendor.status] }}>
                      <option value="active">Active</option><option value="inactive">Inactive</option><option value="blacklisted">Blacklisted</option>
                    </select>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}
                className="w-full max-w-md p-6 rounded-2xl"
                style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)', boxShadow: '0 20px 60px -10px rgb(0 0 0 / 0.3)' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Add Vendor</h2>
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:opacity-70"><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input required placeholder="Vendor Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  <input required type="email" placeholder="Email *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                    <input placeholder="Company" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm">
                      <option value="supplier">Supplier</option><option value="contractor">Contractor</option><option value="service">Service</option><option value="other">Other</option>
                    </select>
                    <input placeholder="GSTIN" value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  </div>
                  <select value={form.paymentTerms} onChange={e => setForm({ ...form, paymentTerms: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm">
                    <option value="Net 15">Net 15</option><option value="Net 30">Net 30</option><option value="Net 45">Net 45</option><option value="Net 60">Net 60</option><option value="COD">COD</option>
                  </select>
                  <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>Add Vendor</button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
