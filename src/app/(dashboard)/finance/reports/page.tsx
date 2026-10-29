'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, DollarSign, Scale, LineChart } from 'lucide-react';

const inr = (n: number) => `₹${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type Line = { code: string; name: string; type?: string; debit?: number; credit?: number; amount?: number };

export default function FinancialReportsPage() {
  const [report, setReport] = useState<any>(null);
  const [type, setType] = useState('profit-loss');
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState<any>(null);
  const [startDate, setStartDate] = useState(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchReport = async () => {
    try {
      const res = await fetch(`/api/reports?type=${type}&startDate=${startDate}&endDate=${endDate}`);
      if (res.ok) setReport(await res.json());
    } finally { setLoading(false); }
  };

  const generate = async () => { setLoading(true); await fetchReport(); };

  useEffect(() => { fetchReport(); }, [type]);

  // 90-day AI cash forecast loads independently of the selected report.
  useEffect(() => {
    fetch('/api/finance/ai/forecast')
      .then(r => (r.ok ? r.json() : null))
      .then(setForecast)
      .catch(() => {});
  }, []);

  const reports = [
    { id: 'profit-loss', label: 'Profit & Loss', icon: TrendingUp, color: 'text-emerald-500' },
    { id: 'balance-sheet', label: 'Balance Sheet', icon: Scale, color: 'text-blue-500' },
    { id: 'trial-balance', label: 'Trial Balance', icon: BarChart3, color: 'text-purple-500' },
    { id: 'cash-flow', label: 'Cash Flow', icon: DollarSign, color: 'text-amber-500' },
  ];

  return (
    <div className="min-h-screen p-6 sm:p-8" style={{ background: 'hsl(var(--page-gradient))' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Financial Reports</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Double-entry ledger — P&L, Balance Sheet, Trial Balance & Cash Flow</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {reports.map(r => (
            <button key={r.id} onClick={() => setType(r.id)} className={`glass-card rounded-2xl p-5 text-left transition-all ${type === r.id ? 'ring-2 ring-purple-500' : ''}`}>
              <r.icon className={`w-7 h-7 mb-2 ${r.color}`} />
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
            <button onClick={generate} disabled={loading} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-60">{loading ? 'Generating…' : 'Generate Report'}</button>
          </div>
        </div>

        {report && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold text-lg mb-4" style={{ color: 'hsl(var(--foreground))' }}>{report.type}</h3>

            {type === 'profit-loss' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SectionTable title="Income" rows={report.income} accent="text-emerald-600" />
                <SectionTable title="Expenses" rows={report.expenses} accent="text-red-600" />
                <div className="md:col-span-2 flex items-center justify-between p-4 rounded-xl" style={{ background: 'hsl(var(--secondary))' }}>
                  <span className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Net Profit</span>
                  <span className={`text-xl font-bold ${report.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{inr(report.netProfit)}</span>
                </div>
              </div>
            )}

            {type === 'trial-balance' && (
              <>
                <LedgerTable rows={report.rows} />
                <TotalsBar pairs={[['Total Debit', report.totalDebit], ['Total Credit', report.totalCredit]]} badge={report.balanced ? 'Balanced' : 'Out of balance'} ok={report.balanced} />
              </>
            )}

            {type === 'balance-sheet' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <SectionTable title="Assets" rows={report.assets} accent="text-blue-600" />
                  <div className="space-y-6">
                    <SectionTable title="Liabilities" rows={report.liabilities} accent="text-red-600" />
                    <SectionTable title="Equity" rows={report.equity} accent="text-purple-600" />
                  </div>
                </div>
                <TotalsBar
                  pairs={[['Total Assets', report.totalAssets], ['Liabilities', report.totalLiabilities], ['Equity', report.totalEquity], ['L + Equity', report.totalLiabilitiesAndEquity]]}
                  badge={report.balanced ? 'Assets = Liabilities + Equity' : 'Does not balance'}
                  ok={report.balanced}
                />
              </>
            )}

            {type === 'cash-flow' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Stat label="Cash In" value={inr(report.cashIn)} cls="text-emerald-600" />
                <Stat label="Cash Out" value={inr(report.cashOut)} cls="text-red-600" />
                <Stat label="Net Flow" value={inr(report.netCashFlow)} cls={report.netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'} />
                <Stat label="Closing Balance" value={inr(report.closingBalance)} cls="text-blue-600" />
              </div>
            )}
          </motion.div>
        )}

        {forecast && <ForecastPanel forecast={forecast} />}
      </div>
    </div>
  );
}

function ForecastPanel({ forecast }: { forecast: any }) {
  const points = (forecast.points || []) as Array<{ weekStart: string; inflow: number; outflow: number; closingCash: number }>;
  const max = Math.max(1, ...points.map(p => Math.abs(p.closingCash)));
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 mt-6">
      <div className="flex items-center gap-2 mb-1">
        <LineChart className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-lg" style={{ color: 'hsl(var(--foreground))' }}>90-Day Cash Flow Forecast</h3>
      </div>
      <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
        Projected from outstanding invoices and your average monthly spend.
        {forecast.runwayDays !== null && <span className="text-red-600 font-medium"> Cash may go negative in ~{forecast.runwayDays} days.</span>}
        {forecast.runwayDays === null && <span className="text-emerald-600 font-medium"> Cash stays positive through the horizon.</span>}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <Stat label="Opening Cash" value={inr(forecast.startingCash)} cls="text-blue-600" />
        <Stat label="Expected In (90d)" value={inr(forecast.expectedInflows90)} cls="text-emerald-600" />
        <Stat label="Projected Out (90d)" value={inr(forecast.projectedOutflows90)} cls="text-red-600" />
        <Stat label="Closing Cash" value={inr(forecast.projectedCash90)} cls={forecast.projectedCash90 >= 0 ? 'text-emerald-600' : 'text-red-600'} />
      </div>
      <div className="flex items-end gap-1 h-32">
        {points.map((p, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full" title={`${p.weekStart}: ${inr(p.closingCash)}`}>
            <div className={`w-full rounded-t ${p.closingCash >= 0 ? 'bg-purple-500/70' : 'bg-red-500/70'}`} style={{ height: `${Math.min(100, (Math.abs(p.closingCash) / max) * 100)}%` }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
        <span>Now</span><span>90 days</span>
      </div>
    </motion.div>
  );
}

function Stat({ label, value, cls }: { label: string; value: string; cls: string }) {
  return (
    <div className="p-4 rounded-xl" style={{ background: 'hsl(var(--secondary))' }}>
      <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</p>
      <p className={`text-lg font-bold ${cls}`}>{value}</p>
    </div>
  );
}

function SectionTable({ title, rows, accent }: { title: string; rows?: Line[]; accent: string }) {
  const list = rows || [];
  const total = list.reduce((s, r) => s + (r.amount ?? 0), 0);
  return (
    <div>
      <p className="text-sm font-semibold mb-2 uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>{title}</p>
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'hsl(var(--border))' }}>
        {list.length === 0 && <p className="text-sm p-4" style={{ color: 'hsl(var(--muted-foreground))' }}>No entries yet.</p>}
        {list.map((r, i) => (
          <div key={r.code + i} className="flex justify-between items-center px-4 py-2.5 text-sm" style={{ borderTop: i ? '1px solid hsl(var(--border))' : 'none' }}>
            <span style={{ color: 'hsl(var(--foreground))' }}>{r.name}</span>
            <span className={`font-semibold ${accent}`}>{inr(r.amount ?? 0)}</span>
          </div>
        ))}
        {list.length > 0 && (
          <div className="flex justify-between items-center px-4 py-2.5 text-sm font-bold" style={{ borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}>
            <span>Total</span><span className={accent}>{inr(total)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function LedgerTable({ rows }: { rows?: Line[] }) {
  const list = rows || [];
  return (
    <div className="rounded-xl overflow-hidden border mb-4" style={{ borderColor: 'hsl(var(--border))' }}>
      <div className="grid grid-cols-[80px_1fr_120px_120px] px-4 py-2 text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--secondary))' }}>
        <span>Code</span><span>Account</span><span className="text-right">Debit</span><span className="text-right">Credit</span>
      </div>
      {list.length === 0 && <p className="text-sm p-4" style={{ color: 'hsl(var(--muted-foreground))' }}>No posted entries yet — issue an invoice, record a payment, or approve an expense.</p>}
      {list.map((r, i) => (
        <div key={r.code + i} className="grid grid-cols-[80px_1fr_120px_120px] px-4 py-2.5 text-sm" style={{ borderTop: '1px solid hsl(var(--border))' }}>
          <span style={{ color: 'hsl(var(--muted-foreground))' }}>{r.code}</span>
          <span style={{ color: 'hsl(var(--foreground))' }}>{r.name}</span>
          <span className="text-right font-medium text-emerald-600">{r.debit ? inr(r.debit) : '—'}</span>
          <span className="text-right font-medium text-red-600">{r.credit ? inr(r.credit) : '—'}</span>
        </div>
      ))}
    </div>
  );
}

function TotalsBar({ pairs, badge, ok }: { pairs: [string, number][]; badge: string; ok: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl" style={{ background: 'hsl(var(--secondary))' }}>
      <div className="flex flex-wrap gap-6">
        {pairs.map(([label, val]) => (
          <div key={label}>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</p>
            <p className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>{inr(val)}</p>
          </div>
        ))}
      </div>
      <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${ok ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'}`}>{badge}</span>
    </div>
  );
}
