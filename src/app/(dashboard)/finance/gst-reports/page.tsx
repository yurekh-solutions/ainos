'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, RefreshCw, CheckCircle2, Upload, FileJson, FileSpreadsheet } from 'lucide-react';

type Tab = 'gstr1' | 'gstr3b' | 'recon';

interface HsnRow { hsn: string; description: string; uqc: string; quantity: number; taxableValue: number; igst: number; cgst: number; sgst: number; cess: number }
interface ReconRow { supplierGstin: string; invoiceNo: string; date: string | null; taxable: number; igst: number; cgst: number; sgst: number; cess: number; status: string; bookTaxable: number | null; bookTax: number; taxIn2b: number }

const inr = (n: number) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const STATUS_LABEL: Record<string, string> = { matched: 'Matched', amount_mismatch: 'Amount mismatch', books_only: 'In books, not in 2B', twob_only: 'In 2B, not in books' };
const STATUS_COLOR: Record<string, string> = { matched: 'text-emerald-600', amount_mismatch: 'text-amber-600', books_only: 'text-orange-600', twob_only: 'text-red-600' };

export default function GstReportsPage() {
  const [tab, setTab] = useState<Tab>('gstr1');
  const [startDate, setStartDate] = useState(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 2B reconciliation state
  const [recon, setRecon] = useState<{ summary: any; rows: ReconRow[] } | null>(null);
  const [reconLoading, setReconLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gst-reports?type=${tab === 'gstr3b' ? 'gstr3b' : 'gstr1'}&startDate=${startDate}&endDate=${endDate}`);
      if (res.ok) setReport(await res.json());
    } finally { setLoading(false); }
  }, [tab, startDate, endDate]);

  useEffect(() => { if (tab !== 'recon') void fetchReport(); }, [fetchReport, tab]);

  const download = (kind: 'gstr1' | 'gstr3b' | 'hsn', format: 'json' | 'csv') => {
    const url = `/api/gst-reports?export=${kind}&format=${format}&startDate=${startDate}&endDate=${endDate}`;
    const a = document.createElement('a');
    a.href = url; a.download = `ainos-${kind}-${startDate}_${endDate}.${format}`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  const markFiled = async (type: 'GSTR1' | 'GSTR3B') => {
    await fetch('/api/gst-reports', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period: report?.period, type, status: 'filed' }),
    });
    void fetchReport();
  };

  const onImport2B = async (file: File) => {
    setReconLoading(true);
    try {
      const rawJson = JSON.parse(await file.text());
      const res = await fetch('/api/gst-reports/reconcile', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawJson, periodStart: startDate, periodEnd: endDate }),
      });
      if (res.ok) setRecon(await res.json());
      else alert('Could not reconcile this 2B file. Ensure it is the JSON downloaded from gst.gov.in.');
    } catch {
      alert('Invalid JSON file.');
    } finally { setReconLoading(false); }
  };

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'gstr1', label: 'GSTR-1 (Outward)' },
    { id: 'gstr3b', label: 'GSTR-3B (Summary)' },
    { id: 'recon', label: '2B Reconciliation' },
  ];

  return (
    <div className="min-h-screen p-6 sm:p-8" style={{ background: 'hsl(var(--page-gradient))' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>GST Reports</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>GSTR-1 / GSTR-3B exports and GSTR-2B input-tax reconciliation</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'btn-primary' : 'glass-card'}`}
              style={{ color: tab === t.id ? undefined : 'hsl(var(--foreground))' }}>{t.label}</button>
          ))}
        </div>

        {/* Date range */}
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
            {tab !== 'recon' && (
              <button onClick={fetchReport} className="btn-secondary rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            )}
          </div>
        </div>

        {tab === 'recon' ? (
          <ReconPanel {...{ recon, reconLoading, fileRef, onImport2B, setRecon }} inr={inr} />
        ) : report ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Summary + export */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-semibold text-lg" style={{ color: 'hsl(var(--foreground))' }}>{report.type}</h3>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>GSTIN {report.gstin || '—'} · Period {report.period}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => download(tab === 'gstr3b' ? 'gstr3b' : 'gstr1', 'json')} className="btn-primary rounded-xl px-3 py-2 text-xs font-medium flex items-center gap-1.5">
                    <FileJson className="w-4 h-4" /> GSTN JSON
                  </button>
                  {tab === 'gstr1' && (
                    <>
                      <button onClick={() => download('gstr1', 'csv')} className="btn-secondary rounded-xl px-3 py-2 text-xs font-medium flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4" /> Invoice CSV
                      </button>
                      <button onClick={() => download('hsn', 'csv')} className="btn-secondary rounded-xl px-3 py-2 text-xs font-medium flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4" /> HSN CSV
                      </button>
                    </>
                  )}
                  <button onClick={() => markFiled(tab === 'gstr3b' ? 'GSTR3B' : 'GSTR1')} className="btn-secondary rounded-xl px-3 py-2 text-xs font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Mark filed
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Invoices" value={String(report.summary?.count ?? 0)} />
                <Stat label="Taxable Value" value={inr(report.summary?.taxableValue)} />
                <Stat label="Output Tax" value={inr(report.summary?.totalTax)} />
                {tab === 'gstr3b' && <Stat label="ITC Eligible" value={inr(report.summary?.itcEligible)} />}
              </div>
              {tab === 'gstr3b' && (
                <div className="mt-3 p-4 rounded-xl" style={{ background: 'hsl(var(--secondary))' }}>
                  <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Net Tax Payable (Output − ITC)</p>
                  <p className="text-2xl font-bold text-purple-600">{inr(report.summary?.netTaxPayable)}</p>
                </div>
              )}
            </div>

            {/* HSN summary */}
            {tab === 'gstr1' && report.hsn?.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h4 className="font-semibold mb-3" style={{ color: 'hsl(var(--foreground))' }}>HSN / SAC Summary</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                      {['HSN', 'Description', 'UQC', 'Qty', 'Taxable', 'IGST', 'CGST', 'SGST'].map(h => (
                        <th key={h} className="text-left p-2 text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {(report.hsn as HsnRow[]).map((r, i) => (
                        <tr key={i} className="border-b" style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
                          <td className="p-2">{r.hsn}</td><td className="p-2">{r.description}</td><td className="p-2">{r.uqc}</td>
                          <td className="p-2 text-right">{r.quantity}</td><td className="p-2 text-right">{inr(r.taxableValue)}</td>
                          <td className="p-2 text-right">{inr(r.igst)}</td><td className="p-2 text-right">{inr(r.cgst)}</td><td className="p-2 text-right">{inr(r.sgst)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Invoice lines */}
            <div className="glass-card rounded-2xl p-6">
              <h4 className="font-semibold mb-3" style={{ color: 'hsl(var(--foreground))' }}>Invoice Detail</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                    {['Invoice', 'Customer', 'GSTIN', 'Type', 'Amount', 'Tax'].map(h => (
                      <th key={h} className="text-left p-2 text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {report.invoices?.map((inv: any, i: number) => (
                      <tr key={i} className="border-b" style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
                        <td className="p-2">{inv.invoiceNumber}</td>
                        <td className="p-2">{inv.customerName}</td>
                        <td className="p-2 text-xs">{inv.customerGstNumber || '-'}</td>
                        <td className="p-2 text-xs">{inv.supplyType === 'inter' ? 'Inter' : 'Intra'}</td>
                        <td className="p-2 text-right">{inr(inv.totalAmount)}</td>
                        <td className="p-2 text-right text-purple-600">{inr((inv.cgstAmount || 0) + (inv.sgstAmount || 0) + (inv.igstAmount || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="glass-card rounded-2xl p-10 text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {loading ? 'Generating report…' : 'No GST-qualified invoices in this period yet.'}
          </div>
        )}
      </div>
    </div>
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

function ReconPanel({ recon, reconLoading, fileRef, onImport2B, setRecon, inr }: any) {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-semibold text-lg mb-1" style={{ color: 'hsl(var(--foreground))' }}>GSTR-2B Reconciliation</h3>
        <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Download the GSTR-2B JSON from <span className="font-medium">gst.gov.in</span> and import it here. We match it against your purchase bills and expense ITC and flag mismatches.
        </p>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport2B(f); }} />
        <button onClick={() => fileRef.current?.click()} disabled={reconLoading} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2">
          <Upload className="w-4 h-4" /> {reconLoading ? 'Reconciling…' : 'Import GSTR-2B JSON'}
        </button>
      </div>

      {recon && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <Stat label="Matched" value={String(recon.summary.matched)} />
            <Stat label="Amount Mismatch" value={String(recon.summary.amountMismatch)} />
            <Stat label="Books Only" value={String(recon.summary.booksOnly)} />
            <Stat label="2B Only" value={String(recon.summary.twobOnly)} />
            <Stat label="ITC Available" value={inr(recon.summary.itcAvail)} />
            <Stat label="ITC At Risk" value={inr(recon.summary.itcAtRisk)} />
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Reconciliation Detail</h4>
              <button onClick={() => { const a = document.createElement('a'); a.href = '/api/gst-reports/reconcile'; }} className="hidden" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                  {['Supplier GSTIN', 'Invoice', '2B Tax', 'Books Tax', 'Status'].map(h => (
                    <th key={h} className="text-left p-2 text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {(recon.rows as ReconRow[]).map((r, i) => (
                    <tr key={i} className="border-b" style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
                      <td className="p-2 text-xs">{r.supplierGstin || '-'}</td>
                      <td className="p-2">{r.invoiceNo}</td>
                      <td className="p-2 text-right">{inr(r.taxIn2b)}</td>
                      <td className="p-2 text-right">{inr(r.bookTax)}</td>
                      <td className={`p-2 font-medium ${STATUS_COLOR[r.status] || ''}`}>{STATUS_LABEL[r.status] || r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {recon.rows.length > 0 && (
              <p className="text-xs mt-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {recon.rows.length} line item(s). Claim ITC only for rows marked <span className="text-emerald-600 font-medium">Matched</span>.
              </p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
