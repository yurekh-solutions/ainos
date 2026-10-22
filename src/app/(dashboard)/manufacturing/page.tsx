'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, X, Edit2, Trash2, Package, Layers, Settings, ClipboardCheck, AlertTriangle, FileText } from 'lucide-react';

interface BOM { id: string; name: string; product?: string; quantity: number; components?: unknown; createdAt: string; }

const TABS = [
  { key: 'boms', label: 'Bills of Materials', icon: Layers },
  { key: 'orders', label: 'Manufacturing Orders', icon: FileText },
  { key: 'workcenters', label: 'Work Centers', icon: Settings },
  { key: 'quality', label: 'Quality Checks', icon: ClipboardCheck },
  { key: 'scrap', label: 'Scrap', icon: AlertTriangle },
];

export default function ManufacturingPage() {
  const [activeTab, setActiveTab] = useState('boms');
  const [data, setData] = useState<Record<string, unknown[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/manufacturing?type=${activeTab}`);
      if (res.ok) {
        const json = await res.json();
        setData(prev => ({ ...prev, [activeTab]: json }));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editId ? `/api/manufacturing?id=${editId}&type=${activeTab}` : `/api/manufacturing?type=${activeTab}`;
      const res = await fetch(url, { method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { resetForm(); fetchData(); }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    try { const res = await fetch(`/api/manufacturing?id=${id}&type=${activeTab}`, { method: 'DELETE' }); if (res.ok) fetchData(); } catch (e) { console.error(e); }
  };

  const resetForm = () => { setForm({}); setEditId(null); setShowForm(false); };

  const getFormFields = (): { key: string; label: string; type: string; required?: boolean; options?: string[] }[] => {
    switch (activeTab) {
      case 'boms': return [
        { key: 'name', label: 'BOM Name', type: 'text', required: true },
        { key: 'product', label: 'Product Name', type: 'text' },
        { key: 'quantity', label: 'Quantity', type: 'number' },
      ];
      case 'orders': return [
        { key: 'productName', label: 'Product', type: 'text', required: true },
        { key: 'quantity', label: 'Quantity', type: 'number', required: true },
        { key: 'plannedDate', label: 'Planned Start', type: 'date' },
      ];
      case 'workcenters': return [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'capacity', label: 'Capacity', type: 'number' },
        { key: 'costPerHour', label: 'Cost/Hour (₹)', type: 'number' },
      ];
      case 'quality': return [
        { key: 'productName', label: 'Product', type: 'text', required: true },
        { key: 'checkType', label: 'Check Type', type: 'select', options: ['visual', 'dimensional', 'functional', 'material'] },
      ];
      case 'scrap': return [
        { key: 'product', label: 'Product', type: 'text', required: true },
        { key: 'quantity', label: 'Quantity', type: 'number', required: true },
        { key: 'reason', label: 'Reason', type: 'text' },
      ];
      default: return [];
    }
  };

  const items = (data[activeTab] || []) as Record<string, unknown>[];
  const filtered = items.filter(item => {
    const name = (item.name || item.product || item.title || '') as string;
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const renderTable = () => {
    switch (activeTab) {
      case 'boms':
        return <>{filtered.map((item, i) => (
          <motion.tr key={item.id as string} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
            className="border-t" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
            <td className="px-4 py-3 font-medium" style={{ color: 'hsl(var(--foreground))' }}>{item.name as string}</td>
            <td className="px-4 py-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{(item.product as string) || '-'}</td>
            <td className="px-4 py-3" style={{ color: 'hsl(var(--foreground))' }}>{item.quantity as number}</td>
            <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{new Date(item.createdAt as string).toLocaleDateString()}</td>
            <td className="px-4 py-3"><div className="flex gap-1">
              <button onClick={() => { setForm({ name: item.name, product: item.product, quantity: item.quantity }); setEditId(item.id as string); setShowForm(true); }} className="p-1 rounded hover:bg-white/10"><Edit2 className="w-4 h-4" style={{ color: '#8B5CF6' }} /></button>
              <button onClick={() => handleDelete(item.id as string)} className="p-1 rounded hover:bg-white/10"><Trash2 className="w-4 h-4" style={{ color: '#ef4444' }} /></button>
            </div></td>
          </motion.tr>))}</>;
      case 'orders':
        return <>{filtered.map((item, i) => {
          const statusColors: Record<string, string> = { draft: '#6b7280', in_progress: '#3b82f6', done: '#10b981', cancelled: '#ef4444' };
          return (
            <motion.tr key={item.id as string} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              className="border-t" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
              <td className="px-4 py-3 font-medium" style={{ color: 'hsl(var(--foreground))' }}>{item.moNumber as string}</td>
              <td className="px-4 py-3" style={{ color: 'hsl(var(--foreground))' }}>{item.product as string}</td>
              <td className="px-4 py-3" style={{ color: 'hsl(var(--foreground))' }}>{item.quantity as number}</td>
              <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: (statusColors[(item.status as string)] || '#6b7280') + '20', color: statusColors[(item.status as string)] || '#6b7280' }}>{item.status as string}</span></td>
              <td className="px-4 py-3"><div className="flex gap-1">
                <button onClick={() => handleDelete(item.id as string)} className="p-1 rounded hover:bg-white/10"><Trash2 className="w-4 h-4" style={{ color: '#ef4444' }} /></button>
              </div></td>
            </motion.tr>);})}</>;
      case 'workcenters':
        return <>{filtered.map((item, i) => (
          <motion.tr key={item.id as string} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
            className="border-t" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
            <td className="px-4 py-3 font-medium" style={{ color: 'hsl(var(--foreground))' }}>{item.name as string}</td>
            <td className="px-4 py-3" style={{ color: 'hsl(var(--foreground))' }}>{item.capacity as number}</td>
            <td className="px-4 py-3" style={{ color: 'hsl(var(--foreground))' }}>₹{(item.costPerHour as number)?.toFixed(2)}</td>
            <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: (item.status as string) === 'active' ? '#10b98120' : '#f59e0b20', color: (item.status as string) === 'active' ? '#10b981' : '#f59e0b' }}>{item.status as string}</span></td>
            <td className="px-4 py-3"><div className="flex gap-1">
              <button onClick={() => { setForm({ name: item.name, capacity: item.capacity, costPerHour: item.costPerHour }); setEditId(item.id as string); setShowForm(true); }} className="p-1 rounded hover:bg-white/10"><Edit2 className="w-4 h-4" style={{ color: '#8B5CF6' }} /></button>
              <button onClick={() => handleDelete(item.id as string)} className="p-1 rounded hover:bg-white/10"><Trash2 className="w-4 h-4" style={{ color: '#ef4444' }} /></button>
            </div></td>
          </motion.tr>))}</>;
      case 'quality':
        return <>{filtered.map((item, i) => {
          const resultColors: Record<string, string> = { pending: '#f59e0b', passed: '#10b981', failed: '#ef4444' };
          return (
            <motion.tr key={item.id as string} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              className="border-t" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
              <td className="px-4 py-3" style={{ color: 'hsl(var(--foreground))' }}>{item.title as string}</td>
              <td className="px-4 py-3 capitalize" style={{ color: 'hsl(var(--muted-foreground))' }}>{item.type as string}</td>
              <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: (resultColors[(item.status as string)] || '#6b7280') + '20', color: resultColors[(item.status as string)] || '#6b7280' }}>{item.status as string}</span></td>
              <td className="px-4 py-3"><button onClick={() => handleDelete(item.id as string)} className="p-1 rounded hover:bg-white/10"><Trash2 className="w-4 h-4" style={{ color: '#ef4444' }} /></button></td>
            </motion.tr>);})}</>;
      case 'scrap':
        return <>{filtered.map((item, i) => (
          <motion.tr key={item.id as string} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
            className="border-t" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
            <td className="px-4 py-3" style={{ color: 'hsl(var(--foreground))' }}>{item.product as string}</td>
            <td className="px-4 py-3" style={{ color: 'hsl(var(--foreground))' }}>{item.quantity as number}</td>
            <td className="px-4 py-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{(item.reason as string) || '-'}</td>
            <td className="px-4 py-3"><button onClick={() => handleDelete(item.id as string)} className="p-1 rounded hover:bg-white/10"><Trash2 className="w-4 h-4" style={{ color: '#ef4444' }} /></button></td>
          </motion.tr>))}</>;
      default: return null;
    }
  };

  const getTableHeaders = () => {
    switch (activeTab) {
      case 'boms': return ['Name', 'Product', 'Qty', 'Created', 'Actions'];
      case 'orders': return ['Order #', 'Product', 'Qty', 'Status', 'Actions'];
      case 'workcenters': return ['Name', 'Capacity', 'Cost/Hour', 'Status', 'Actions'];
      case 'quality': return ['Product', 'Check Type', 'Status', 'Actions'];
      case 'scrap': return ['Product', 'Qty', 'Reason', 'Actions'];
      default: return [];
    }
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div><h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Manufacturing Hub</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Manage bills of materials, production orders, and quality control</p></div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium" style={{ background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' }}>
            <Plus className="w-4 h-4" /> New {TABS.find(t => t.key === activeTab)?.label.replace(/s$/, '').replace('Bills of Materials', 'BOM')}
          </motion.button>
        </div>

        <div className="flex flex-wrap gap-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => { setActiveTab(t.key); setLoading(true); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t.key ? 'text-white' : ''}`}
              style={activeTab === t.key ? { background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' } : { background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>))}
        </div>

        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>

        {loading ? <p className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading data...</p> :
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'hsl(var(--border))' }}>
            <table className="w-full text-sm"><thead><tr style={{ background: 'hsl(var(--card))' }}>
              {getTableHeaders().map(h => <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>)}
            </tr></thead><tbody>{renderTable()}</tbody></table>
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <Layers className="w-12 h-12 mx-auto mb-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <p className="font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>No items found</p>
                <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Create your first {TABS.find(t => t.key === activeTab)?.label.toLowerCase()} to get started</p>
              </div>
            )}
          </div>}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-xl p-6 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{editId ? 'Edit' : 'New'} {TABS.find(t => t.key === activeTab)?.label.replace(/s$/, '')}</h2>
                <button onClick={() => setShowForm(false)}><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button></div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {getFormFields().map(field => (
                  <div key={field.key}><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>{field.label}</label>
                    {field.type === 'select' ? (
                      <select value={(form[field.key] as string) || ''} onChange={e => setForm({ ...form, [field.key]: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
                        {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type={field.type} required={field.required} value={(form[field.key] as string | number) || ''} onChange={e => setForm({ ...form, [field.key]: field.type === 'number' ? +e.target.value : e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                    )}
                  </div>))}
                <button type="submit" className="w-full py-2.5 rounded-lg text-white text-sm font-medium" style={{ background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' }}>{editId ? 'Update' : 'Create'}</button>
              </form>
            </motion.div>
          </div>)}
      </motion.div>
    </div>
  );
}
