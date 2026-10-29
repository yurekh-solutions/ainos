'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, Upload, Link2, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface TxnMatch {
  invoiceId: string; invoiceNumber: string; customerName: string | null;
  invoiceTotal: number; invoicePaid: number; outstanding: number; allocAmount: number;
  confidence: 'exact' | 'high' | 'medium'; reason: string;
}
interface ReconcileRow {
  txn: { date: string; description: string; reference: string; debit: number; credit: number };
  txnId: string | null; match: TxnMatch | null;
}
interface Account { id: string; name: string; accountNumber?: string | null; bankName?: string | null; balance?: number; transactions?: unknown[] }
interface Summary { parsed: number; persisted: number; matched: number; unmatched: number; creditTotal: number; matchedAmount: number }

const inr = (n: number) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const CONF_STYLE: Record<string, string> = { exact: 'text-emerald-600', high: 'text-blue-600', medium: 'text-amber-600' };

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', accountNumber: '', ifscCode: '', bankName: '', balance: 0 });

  const loadAccounts = () => fetch('/api/bank-accounts').then(r => r.ok ? r.json() : []).then(setAccounts).catch(() => {});
  useEffect(() => { loadAccounts(); }, []);

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
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Manage bank accounts and reconcile statement payments</p>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {accounts.map((acc, i) => (
            <motion.div key={acc.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"><Building2 className="w-5 h-5 text-white" /></div>
                <div><p className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>{acc.name}</p><p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{acc.bankName}</p></div>
              </div>
              <p className="text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{acc.accountNumber}</p>
              <p className="text-xl font-bold text-emerald-600">{inr(acc.balance || 0)}</p>
              <p className="text-xs mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{(acc.transactions || []).length} recent transactions</p>
            </motion.div>
          ))}
        </div>
        {accounts.length === 0 && <p className="text-center py-12 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>No bank accounts added yet</p>}

        {accounts.length > 0 && <ReconcilePanel accounts={accounts} onChanged={loadAccounts} />}
      </div>
    </div>
  );
}

function ReconcilePanel({ accounts, onChanged }: { accounts: Account[]; onChanged: () => void }) {
  const [accountId, setAccountId] = useState('');
  const activeAccountId = accountId || accounts[0]?.id || '';
  const [rows, setRows] = useState<ReconcileRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File) => {
    setError(''); setSummary(null); setRows([]); setApplied(new Set());
    const csv = await file.text();
    setLoading(true);
    try {
      const res = await fetch('/api/bank-reconciliation', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId: activeAccountId, csv }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Could not reconcile this file'); return; }
      setRows(data.rows || []); setSummary(data.summary);
    } catch { setError('Upload failed'); }
    finally { setLoading(false); }
  };

  const applyRow = async (row: ReconcileRow) => {
    const m = row.match; if (!m || !row.txnId) return;
    const target = Math.min(m.invoiceTotal, m.invoicePaid + m.allocAmount);
    const status = target >= m.invoiceTotal - 0.01 ? 'paid' : 'partial';
    const invRes = await fetch('/api/invoices', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: m.invoiceId, status, paidAmount: target, paidDate: new Date().toISOString(), paymentMethod: 'bank' }),
    });
    if (!invRes.ok) return;
    await fetch('/api/bank-reconciliation', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applied: [{ transactionId: row.txnId, invoiceId: m.invoiceId }] }),
    });
    setApplied(prev => new Set(prev).add(row.txnId!));
  };

  const applyAll = async () => {
    setApplying(true);
    try { for (const row of rows) if (row.match && row.txnId && !applied.has(row.txnId)) await applyRow(row); }
    finally { setApplying(false); onChanged(); }
  };

  const matchedRows = rows.filter(r => r.match);
  const pending = matchedRows.filter(r => r.txnId && !applied.has(r.txnId));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-lg" style={{ color: 'hsl(var(--foreground))' }}>Reconcile Bank Statement</h3>
      </div>
      <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
        Upload a CSV statement from your bank. Incoming payments are auto-matched to open invoices by invoice number, amount and customer.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select value={activeAccountId} onChange={e => setAccountId(e.target.value)} className="glass-input rounded-xl px-4 py-2.5 text-sm">
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name} {a.accountNumber ? `· ${a.accountNumber}` : ''}</option>)}
        </select>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
        <button onClick={() => fileRef.current?.click()} disabled={loading} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} {loading ? 'Matching…' : 'Upload CSV'}
        </button>
        {pending.length > 0 && (
          <button onClick={applyAll} disabled={applying} className="btn-secondary rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2">
            {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Apply {pending.length} payment{pending.length > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <Stat label="Parsed" value={String(summary.parsed)} />
          <Stat label="Matched" value={String(summary.matched)} />
          <Stat label="Matched Value" value={inr(summary.matchedAmount)} />
          <Stat label="Unmatched Credits" value={String(summary.unmatched)} />
        </div>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b" style={{ borderColor: 'hsl(var(--border))' }}>
              {['Date', 'Description', 'Credit', 'Matched Invoice', 'Confidence', ''].map(h => (
                <th key={h} className="text-left p-2 text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b" style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
                  <td className="p-2 whitespace-nowrap">{row.txn.date}</td>
                  <td className="p-2 max-w-[220px] truncate" title={row.txn.description}>{row.txn.description || row.txn.reference || '—'}</td>
                  <td className="p-2 text-right whitespace-nowrap">{row.txn.credit > 0 ? inr(row.txn.credit) : <span style={{ color: 'hsl(var(--muted-foreground))' }}>{inr(row.txn.debit)}</span>}</td>
                  <td className="p-2">{row.match ? <span>{row.match.invoiceNumber} <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>({row.match.customerName || '—'})</span></span> : <span style={{ color: 'hsl(var(--muted-foreground))' }}>No match</span>}</td>
                  <td className="p-2">{row.match ? <span className={`font-medium capitalize ${CONF_STYLE[row.match.confidence]}`}>{row.match.confidence} · {inr(row.match.allocAmount)}</span> : '—'}</td>
                  <td className="p-2 text-right">
                    {row.match && row.txnId && (applied.has(row.txnId)
                      ? <span className="text-emerald-600 text-xs font-medium flex items-center gap-1 justify-end"><CheckCircle2 className="w-4 h-4" /> Applied</span>
                      : <button onClick={() => applyRow(row)} className="btn-secondary rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1"><Link2 className="w-3.5 h-3.5" /> Apply</button>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl" style={{ background: 'hsl(var(--secondary))' }}>
      <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</p>
      <p className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>{value}</p>
    </div>
  );
}
