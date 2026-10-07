'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, FileText, Wallet } from 'lucide-react';

export default function DayBookPage() {
  const [data, setData] = useState({ invoices: [], expenses: [] });
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetch(`/api/daybook?date=${date}`).then(r => r.ok ? r.json() : { invoices: [], expenses: [] }).then(setData).catch(() => {});
  }, [date]);

  const totalIn = (data.invoices as any[]).reduce((s, i) => s + (i.totalAmount || 0), 0);
  const totalOut = (data.expenses as any[]).reduce((s, e) => s + e.amount, 0);

  return (
    <div className="min-h-screen p-6 sm:p-8" style={{ background: 'hsl(var(--page-gradient))' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Day Book</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Daily transaction log</p>
          </div>
          <input type="date" className="glass-input rounded-xl px-4 py-2 text-sm" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="glass-card rounded-2xl p-5">
            <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Invoices</p>
            <p className="text-2xl font-bold text-emerald-600">₹{totalIn.toLocaleString('en-IN')}</p>
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{(data.invoices as any[]).length} entries</p>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">₹{totalOut.toLocaleString('en-IN')}</p>
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{(data.expenses as any[]).length} entries</p>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Net</p>
            <p className={`text-2xl font-bold ${totalIn - totalOut >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>₹{Math.abs(totalIn - totalOut).toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}><FileText className="w-4 h-4 text-emerald-500" /> Invoices</h3>
            <div className="space-y-3">
              {(data.invoices as any[]).map((inv, i) => (
                <motion.div key={inv.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'hsl(var(--secondary))' }}>
                  <div><p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{inv.invoiceNumber}</p><p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{inv.customerName}</p></div>
                  <p className="text-sm font-bold text-emerald-600">₹{(inv.totalAmount || 0).toLocaleString('en-IN')}</p>
                </motion.div>
              ))}
              {(data.invoices as any[]).length === 0 && <p className="text-center py-8 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No invoices</p>}
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}><Wallet className="w-4 h-4 text-red-500" /> Expenses</h3>
            <div className="space-y-3">
              {(data.expenses as any[]).map((exp, i) => (
                <motion.div key={exp.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'hsl(var(--secondary))' }}>
                  <div><p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{exp.category}</p><p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{exp.description}</p></div>
                  <p className="text-sm font-bold text-red-600">₹{exp.amount.toLocaleString('en-IN')}</p>
                </motion.div>
              ))}
              {(data.expenses as any[]).length === 0 && <p className="text-center py-8 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No expenses</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
