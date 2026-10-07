'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, Search } from 'lucide-react';

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', accountNumber: '', ifscCode: '', bankName: '', balance: 0 });

  useEffect(() => {
    fetch('/api/bank-accounts').then(r => r.ok ? r.json() : []).then(setAccounts).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/bank-accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { const data = await res.json(); setAccounts([...accounts, data]); setShowForm(false); setForm({ name: '', accountNumber: '', ifscCode: '', bankName: '', balance: 0 }); }
  };

  return (
    <div className="min-h-screen p-6 sm:p-8" style={{ background: 'hsl(var(--page-gradient))' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Bank Accounts</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Manage bank accounts and reconciliation</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2"><Plus className="w-4 h-4" /> Add Account</button>
        </div>

        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 mb-6">
            <h3 className="font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>New Bank Account</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input className="glass-input rounded-xl px-4 py-2.5 text-sm" placeholder="Account Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              <input className="glass-input rounded-xl px-4 py-2.5 text-sm" placeholder="Account Number" value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })} required />
              <input className="glass-input rounded-xl px-4 py-2.5 text-sm" placeholder="IFSC Code" value={form.ifscCode} onChange={e => setForm({ ...form, ifscCode: e.target.value })} />
              <input className="glass-input rounded-xl px-4 py-2.5 text-sm" placeholder="Bank Name" value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} />
              <input className="glass-input rounded-xl px-4 py-2.5 text-sm" placeholder="Opening Balance" type="number" value={form.balance} onChange={e => setForm({ ...form, balance: parseFloat(e.target.value) || 0 })} />
              <button type="submit" className="btn-primary rounded-xl px-4 py-2.5 text-sm font-medium">Save Account</button>
            </form>
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc, i) => (
            <motion.div key={acc.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"><Building2 className="w-5 h-5 text-white" /></div>
                <div><p className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>{acc.name}</p><p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{acc.bankName}</p></div>
              </div>
              <p className="text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{acc.accountNumber}</p>
              <p className="text-xl font-bold text-emerald-600">₹{(acc.balance || 0).toLocaleString('en-IN')}</p>
              <p className="text-xs mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{(acc.transactions || []).length} recent transactions</p>
            </motion.div>
          ))}
        </div>
        {accounts.length === 0 && <p className="text-center py-12 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>No bank accounts added yet</p>}
      </div>
    </div>
  );
}
