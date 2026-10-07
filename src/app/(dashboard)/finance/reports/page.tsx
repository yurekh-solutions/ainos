'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function FinancialReportsPage() {
  const [report, setReport] = useState<any>(null);
  const [type, setType] = useState('profit-loss');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchReport = async () => {
    const res = await fetch(`/api/reports?type=${type}&startDate=${startDate}&endDate=${endDate}`);
    if (res.ok) setReport(await res.json());
  };

  useEffect(() => { fetchReport(); }, []);

  const reports = [
    { id: 'profit-loss', label: 'Profit & Loss', icon: TrendingUp, color: 'text-emerald-500' },
    { id: 'trial-balance', label: 'Trial Balance', icon: BarChart3, color: 'text-blue-500' },
    { id: 'cash-flow', label: 'Cash Flow', icon: DollarSign, color: 'text-purple-500' },
  ];

  return (
    <div className="min-h-screen p-6 sm:p-8" style={{ background: 'hsl(var(--page-gradient))' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Financial Reports</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>P&L, Balance Sheet, Cash Flow & more</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {reports.map(r => (
            <button key={r.id} onClick={() => { setType(r.id); }} className={`glass-card rounded-2xl p-5 text-left transition-all ${type === r.id ? 'ring-2 ring-purple-500' : ''}`}>
              <r.icon className={`w-8 h-8 mb-2 ${r.color}`} />
              <p className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>{r.label}</p>
            </button>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-5 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>From</label>
              <input type="date" className="glass-input rounded-xl px-4 py-2.5 text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>To</label>
              <input type="date" className="glass-input rounded-xl px-4 py-2.5 text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <button onClick={fetchReport} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-medium">Generate Report</button>
          </div>
        </div>

        {report && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold text-lg mb-4" style={{ color: 'hsl(var(--foreground))' }}>{report.type}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {report.totalRevenue !== undefined && (
                <div className="p-4 rounded-xl" style={{ background: 'hsl(var(--secondary))' }}>
                  <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Revenue</p>
                  <p className="text-xl font-bold text-emerald-600">₹{report.totalRevenue.toLocaleString('en-IN')}</p>
                </div>
              )}
              {report.totalExpenses !== undefined && (
                <div className="p-4 rounded-xl" style={{ background: 'hsl(var(--secondary))' }}>
                  <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Expenses</p>
                  <p className="text-xl font-bold text-red-600">₹{report.totalExpenses.toLocaleString('en-IN')}</p>
                </div>
              )}
              {report.netProfit !== undefined && (
                <div className="p-4 rounded-xl" style={{ background: 'hsl(var(--secondary))' }}>
                  <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Net Profit</p>
                  <p className={`text-xl font-bold ${report.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>₹{report.netProfit.toLocaleString('en-IN')}</p>
                </div>
              )}
              {report.cashIn !== undefined && (
                <div className="p-4 rounded-xl" style={{ background: 'hsl(var(--secondary))' }}>
                  <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Cash In</p>
                  <p className="text-xl font-bold text-emerald-600">₹{report.cashIn.toLocaleString('en-IN')}</p>
                </div>
              )}
              {report.cashOut !== undefined && (
                <div className="p-4 rounded-xl" style={{ background: 'hsl(var(--secondary))' }}>
                  <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Cash Out</p>
                  <p className="text-xl font-bold text-red-600">₹{report.cashOut.toLocaleString('en-IN')}</p>
                </div>
              )}
              {report.netCashFlow !== undefined && (
                <div className="p-4 rounded-xl" style={{ background: 'hsl(var(--secondary))' }}>
                  <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Net Cash Flow</p>
                  <p className={`text-xl font-bold ${report.netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>₹{report.netCashFlow.toLocaleString('en-IN')}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
