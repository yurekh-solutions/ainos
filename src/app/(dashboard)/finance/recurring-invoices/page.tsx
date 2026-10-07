'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Pause, Play } from 'lucide-react';
import Link from 'next/link';

export default function RecurringInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/recurring-invoices').then(r => r.ok ? r.json() : []).then(setInvoices).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen p-6 sm:p-8" style={{ background: 'hsl(var(--page-gradient))' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Recurring Invoices</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Automated invoice generation</p>
          </div>
          <Link href="/finance/recurring-invoices/new" className="btn-primary rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2"><Plus className="w-4 h-4" /> New Recurring</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {invoices.map((inv, i) => (
            <motion.div key={inv.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-500/10 text-purple-600">{inv.frequency}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${inv.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>{inv.status}</span>
              </div>
              <p className="font-semibold text-sm mb-1" style={{ color: 'hsl(var(--foreground))' }}>{inv.customerName || 'No customer'}</p>
              <p className="text-xs mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>Next run: {new Date(inv.nextRunDate).toLocaleDateString('en-IN')}</p>
              <div className="flex items-center gap-2">
                <button className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" style={{ color: 'hsl(var(--foreground))' }}>
                  {inv.status === 'active' ? <><Pause className="w-3 h-3 inline mr-1" />Pause</> : <><Play className="w-3 h-3 inline mr-1" />Resume</>}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        {invoices.length === 0 && (
          <div className="text-center py-16">
            <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>No recurring invoices set up</p>
            <Link href="/finance/recurring-invoices/new" className="btn-primary rounded-xl px-4 py-2 text-sm font-medium inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Create First Recurring Invoice</Link>
          </div>
        )}
      </div>
    </div>
  );
}
