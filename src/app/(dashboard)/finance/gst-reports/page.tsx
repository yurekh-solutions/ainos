'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, RefreshCw, CheckCircle2, Upload, FileJson, FileSpreadsheet, ShieldAlert, AlertTriangle, CalendarClock, ListChecks, ExternalLink, Save, ChevronDown, ChevronUp } from 'lucide-react';

type Tab = 'gstr1' | 'gstr3b' | 'recon' | 'anomaly' | 'pack';
type Scheme = 'monthly' | 'qrmp' | 'composition';

interface HsnRow { hsn: string; description: string; uqc: string; quantity: number; taxableValue: number; igst: number; cgst: number; sgst: number; cess: number }
interface ReconRow { supplierGstin: string; invoiceNo: string; date: string | null; taxable: number; igst: number; cgst: number; sgst: number; cess: number; status: string; bookTaxable: number | null; bookTax: number; taxIn2b: number }

const inr = (n: number) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const STATUS_LABEL: Record<string, string> = { matched: 'Matched', amount_mismatch: 'Amount mismatch', books_only: 'In books, not in 2B', twob_only: 'In 2B, not in books' };
const STATUS_COLOR: Record<string, string> = { matched: 'text-emerald-600', amount_mismatch: 'text-amber-600', books_only: 'text-orange-600', twob_only: 'text-red-600' };

export default function GstReportsPage() {
  const [tab, setTab] = useState<Tab>('gstr1');
  // GST returns are filed one calendar month at a time, so the default window is
  // this month. A rolling 30 days would straddle two tax periods and mix them.
  const [startDate, setStartDate] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; });
  const [endDate, setEndDate] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 2B reconciliation state
  const [recon, setRecon] = useState<{ summary: any; rows: ReconRow[] } | null>(null);
  const [reconLoading, setReconLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // AI anomaly scan state
  const [anomaly, setAnomaly] = useState<any>(null);
  const [anomalyLoading, setAnomalyLoading] = useState(false);

  // Self-filing pack state
  const [pack, setPack] = useState<any>(null);
  const [packLoading, setPackLoading] = useState(false);
  const [scheme, setScheme] = useState<Scheme>('monthly');
  const [priorTurnover, setPriorTurnover] = useState('');
  const [ineligibleItc, setIneligibleItc] = useState('');
  const [arn, setArn] = useState('');
  const [challanNo, setChallanNo] = useState('');
  const [savingRecord, setSavingRecord] = useState(false);

  const packQuery = useCallback(() => {
    const p = new URLSearchParams({ startDate, endDate, scheme });
    if (priorTurnover) p.set('priorTurnover', priorTurnover);
    if (ineligibleItc) p.set('ineligibleItc', ineligibleItc);
    return p.toString();
  }, [startDate, endDate, scheme, priorTurnover, ineligibleItc]);

  const fetchPack = useCallback(async () => {
    setPackLoading(true);
    try {
      const res = await fetch(`/api/gst-reports/filing-pack?${packQuery()}`);
      if (res.ok) setPack(await res.json());
    } finally { setPackLoading(false); }
  }, [packQuery]);

  const downloadPack = (params: Record<string, string>) => {
    const p = new URLSearchParams({ ...params, startDate, endDate, scheme });
    if (priorTurnover) p.set('priorTurnover', priorTurnover);
    if (ineligibleItc) p.set('ineligibleItc', ineligibleItc);
    const a = document.createElement('a');
    a.href = `/api/gst-reports/filing-pack?${p.toString()}`;
    a.download = '';
    document.body.appendChild(a); a.click(); a.remove();
  };

  const recordFiled = async (type: 'GSTR1' | 'GSTR3B') => {
    setSavingRecord(true);
    try {
      await fetch('/api/gst-reports/filing-pack', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: pack?.period, type, arn, challanNo }),
      });
      void fetchPack();
    } finally { setSavingRecord(false); }
  };

  const fetchAnomalies = useCallback(async () => {
    setAnomalyLoading(true);
    try {
      const res = await fetch(`/api/finance/ai/anomalies?from=${startDate}&to=${endDate}`);
      if (res.ok) setAnomaly(await res.json());
    } finally { setAnomalyLoading(false); }
  }, [startDate, endDate]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gst-reports?type=${tab === 'gstr3b' ? 'gstr3b' : 'gstr1'}&startDate=${startDate}&endDate=${endDate}`);
      if (res.ok) setReport(await res.json());
    } finally { setLoading(false); }
  }, [tab, startDate, endDate]);

  useEffect(() => { if (tab !== 'recon' && tab !== 'anomaly' && tab !== 'pack') void fetchReport(); }, [fetchReport, tab]);
  useEffect(() => { if (tab === 'anomaly') void fetchAnomalies(); }, [tab, fetchAnomalies]);
  useEffect(() => { if (tab === 'pack') void fetchPack(); }, [tab, fetchPack]);

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
    { id: 'pack', label: 'File It Yourself' },
    { id: 'gstr1', label: 'GSTR-1 (Outward)' },
    { id: 'gstr3b', label: 'GSTR-3B (Summary)' },
    { id: 'recon', label: '2B Reconciliation' },
    { id: 'anomaly', label: 'AI Anomalies' },
  ];

  return (
    <div className="min-h-screen p-6 sm:p-8" style={{ background: 'hsl(var(--page-gradient))' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>GST Reports</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Build your GST return here, then submit it yourself on gst.gov.in</p>
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
            {tab !== 'recon' && tab !== 'anomaly' && tab !== 'pack' && (
              <button onClick={fetchReport} className="btn-secondary rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            )}
            {tab === 'anomaly' && (
              <button onClick={fetchAnomalies} className="btn-secondary rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Re-scan
              </button>
            )}
            {tab === 'pack' && (
              <>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>How you file</label>
                  <select value={scheme} onChange={e => setScheme(e.target.value as Scheme)}
                    className="glass-input rounded-xl px-4 py-2.5 text-sm">
                    <option value="monthly">Every month</option>
                    <option value="qrmp">Quarterly (small taxpayer scheme)</option>
                    <option value="composition">Composition (1% / 0.5% slabs)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Last year turnover (₹)</label>
                  <input type="number" className="glass-input rounded-xl px-4 py-2.5 text-sm w-40" placeholder="for late-fee limit"
                    value={priorTurnover} onChange={e => setPriorTurnover(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>ITC not allowed (₹)</label>
                  <input type="number" className="glass-input rounded-xl px-4 py-2.5 text-sm w-40" placeholder="section 17(5)"
                    value={ineligibleItc} onChange={e => setIneligibleItc(e.target.value)} />
                </div>
                <button onClick={fetchPack} disabled={packLoading} className="btn-secondary rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2 disabled:opacity-60">
                  <RefreshCw className={`w-4 h-4 ${packLoading ? 'animate-spin' : ''}`} /> Rebuild pack
                </button>
              </>
            )}
          </div>
        </div>

        {tab === 'pack' ? (
          <FilingPackPanel
            {...{ pack, packLoading, scheme, arn, challanNo, setArn, setChallanNo, savingRecord, downloadPack, recordFiled }}
            inr={inr}
          />
        ) : tab === 'recon' ? (
          <ReconPanel {...{ recon, reconLoading, fileRef, onImport2B, setRecon }} inr={inr} />
        ) : tab === 'anomaly' ? (
          <AnomalyPanel anomaly={anomaly} loading={anomalyLoading} />
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

function AnomalyPanel({ anomaly, loading }: { anomaly: any; loading: boolean }) {
  const SEV: Record<string, string> = { high: 'text-red-600', medium: 'text-amber-600', low: 'text-blue-600' };
  if (loading && !anomaly) return <div className="glass-card rounded-2xl p-10 text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Scanning invoices for compliance issues…</div>;
  if (!anomaly) return <div className="glass-card rounded-2xl p-10 text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>No scan yet.</div>;
  const issues = (anomaly.issues || []) as Array<{ invoiceNumber: string; customerName: string | null; severity: string; type: string; message: string }>;
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-lg" style={{ color: 'hsl(var(--foreground))' }}>AI Compliance Anomaly Scan</h3>
        </div>
        <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>Scanned {anomaly.scanned} invoice(s). Automatic checks for GSTIN validity, inter/intra-state split, tax reconciliation, HSN and payment mismatches.</p>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="High" value={String(anomaly.counts?.high ?? 0)} />
          <Stat label="Medium" value={String(anomaly.counts?.medium ?? 0)} />
          <Stat label="Low" value={String(anomaly.counts?.low ?? 0)} />
        </div>
      </div>
      <div className="glass-card rounded-2xl p-6">
        {issues.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: 'hsl(var(--muted-foreground))' }}>All clear — no anomalies detected in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                {['Severity', 'Invoice', 'Customer', 'Issue'].map(h => (
                  <th key={h} className="text-left p-2 text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {issues.map((r, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
                    <td className={`p-2 font-medium capitalize ${SEV[r.severity] || ''}`}>{r.severity}</td>
                    <td className="p-2">{r.invoiceNumber}</td>
                    <td className="p-2">{r.customerName || '-'}</td>
                    <td className="p-2">{r.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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

// ── File It Yourself ────────────────────────────────────────────────────────
interface PackIssue { severity: string; invoiceNumber: string; field: string; message: string; fixHref?: string }
interface PackReturn { form: string; label: string; dueDate: string; note: string }
interface PackStep { n: number; title: string; detail: string; portalPath?: string }
interface PackSource { name: string; report: string; where: string; mapsTo: string }
interface PackTaxCells { taxable?: number; igst?: number; cgst?: number; sgst?: number; cess?: number; amount?: number }
interface FilingPackShape {
  gstin: string;
  company: string;
  period: string;
  scheme: string;
  validation: { blocking: PackIssue[]; warnings: PackIssue[]; checked: number; clean: boolean };
  due: { returns: PackReturn[] };
  fees: { daysLate: number; daysGstr1Late: number; gstr1LateFee: number; gstr3bLateFee: number; interestOnNetTax: number; total: number; isNil: boolean };
  summary: { invoiceCount: number; taxableValue: number; outputTax: number; itcEligible: number; netTaxPayable: number; creditCarriedForward: number; isNil: boolean };
  gstr3b: {
    table3: Record<string, PackTaxCells | { exempt: number } | { upward: number; downward: number }>;
    table4: { eligible: PackTaxCells; ineligible: PackTaxCells; net: PackTaxCells };
    table5: { interest: number; lateFee: number; other: number };
    utilisation: { itcUsed: PackTaxCells; cashPaid: PackTaxCells; totalPayable: PackTaxCells };
    notes: string[];
  };
  checklist: PackStep[];
  marketplaceSources: PackSource[];
}

const CELL_HEADS = ['Table', 'What goes here', 'Taxable Value', 'IGST', 'CGST', 'SGST / UTGST'];

function FilingPackPanel({
  pack, packLoading, arn, challanNo, setArn, setChallanNo, savingRecord, downloadPack, recordFiled, inr,
}: {
  pack: FilingPackShape | null;
  packLoading: boolean;
  scheme: string;
  arn: string;
  challanNo: string;
  setArn: (v: string) => void;
  setChallanNo: (v: string) => void;
  savingRecord: boolean;
  downloadPack: (p: Record<string, string>) => void;
  recordFiled: (t: 'GSTR1' | 'GSTR3B') => void;
  inr: (n: number) => string;
}) {
  const [simple, setSimple] = useState(true);
  if (packLoading && !pack) {
    return <div className="glass-card rounded-2xl p-10 text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Reading your invoices and expenses for this period…</div>;
  }
  if (!pack) {
    return <div className="glass-card rounded-2xl p-10 text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>No pack yet. Pick a period and rebuild.</div>;
  }

  const blocking = pack.validation.blocking;
  const warnings = pack.validation.warnings;

  const rows3b: Array<[string, string, PackTaxCells | number]> = [
    ['3.1.0', 'Sales to other states (IGST)', pack.gstr3b.table3.t313 as PackTaxCells],
    ['3.1.1', 'Sales within your state (CGST + SGST)', pack.gstr3b.table3.t314 as PackTaxCells],
    ['3.1.2', 'Nil-rated, exempt and non-GST sales', (pack.gstr3b.table3.t312 as { exempt: number }).exempt],
    ['3.1.5 (A)', 'Zero-rated supplies on payment of tax', pack.gstr3b.table3.t316 as PackTaxCells],
    ['3.1.5 (B1)', 'Upward adjustments — debit notes', (pack.gstr3b.table3.t315 as { upward: number }).upward],
    ['3.1.5 (B2)', 'Downward adjustments — credit notes', (pack.gstr3b.table3.t315 as { downward: number }).downward],
    ['4.18', 'Input tax credit available to set off', pack.gstr3b.table4.net],
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* What this page does */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
            <ListChecks className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <h3 className="font-semibold text-lg" style={{ color: 'hsl(var(--foreground))' }}>Your return, ready to file</h3>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              AINOS works the return out from your invoices, expenses and credit notes and packages it for upload.
              You submit it on gst.gov.in with your own OTP, EVC or digital signature — nothing is filed for you, and there is no
              per-return charge from us for preparing it.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="GSTIN" value={pack.gstin || 'Add it in Settings'} />
          <Stat label="Tax Period" value={pack.period} />
          <Stat label="Invoices Considered" value={String(pack.summary.invoiceCount)} />
          <Stat label="Tax To Pay" value={inr(pack.summary.netTaxPayable)} />
        </div>
      </div>

      {/* Readiness */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h4 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Step 1 · Check the data</h4>
          <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${blocking.length === 0 ? 'text-emerald-700' : 'text-red-700'}`}
            style={{ background: blocking.length === 0 ? 'hsl(152 60% 95%)' : 'hsl(0 70% 96%)' }}>
            {blocking.length === 0 ? 'Ready to upload' : `${blocking.length} item(s) will be rejected`}
          </span>
        </div>

        {blocking.length === 0 && warnings.length === 0 ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Nothing to fix. Every invoice has a number, a date, a place of supply and a valid customer GSTIN where present.
          </div>
        ) : (
          <div className="space-y-2">
            {blocking.slice(0, 12).map((i, k) => (
              <div key={`b${k}`} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
                <span style={{ color: 'hsl(var(--foreground))' }}>
                  <span className="font-medium">{i.invoiceNumber}</span> — {i.message}
                </span>
                {i.fixHref && <a href={i.fixHref} className="text-xs text-purple-700 underline shrink-0">Fix</a>}
              </div>
            ))}
            {blocking.length > 12 && (
              <button onClick={() => downloadPack({ download: 'sheet', sheet: 'issues' })} className="text-xs text-purple-700 underline">
                + {blocking.length - 12} more — download the full issues sheet
              </button>
            )}
            {warnings.slice(0, 8).map((i, k) => (
              <div key={`w${k}`} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <span className="font-medium">{i.invoiceNumber}</span> — {i.message}
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs mt-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {pack.validation.checked} invoice(s) checked. These are the mistakes that make the portal refuse an upload, so clearing them
          first is what saves the re-do.
        </p>
      </div>

      {/* Simple-mode actions */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => downloadPack({ download: 'gstr1-json' })} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2">
            <FileJson className="w-4 h-4" /> Download the upload file
          </button>
          <a href="https://services.gst.gov.in/service/login" target="_blank" rel="noopener noreferrer"
            className="btn-secondary rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2">
            <ExternalLink className="w-4 h-4" /> Open the portal and sign in
          </a>
        </div>
        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Upload the file on the portal, verify the numbers, file with the OTP sent to your own mobile, then save the
          acknowledgement number below. The screen-by-screen guide, dates, fees and marketplace tips sit under the button.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Acknowledgement number</label>
            <input value={arn} onChange={e => setArn(e.target.value.replace(/\D/g, '').slice(0, 15))} inputMode="numeric"
              className="glass-input rounded-xl px-4 py-2.5 text-sm w-52" placeholder="15 digits" />
          </div>
          <button onClick={() => recordFiled('GSTR3B')} disabled={savingRecord || arn.length !== 15}
            className="btn-primary rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> Save against GSTR-3B
          </button>
          <button onClick={() => recordFiled('GSTR1')} disabled={savingRecord || arn.length !== 15}
            className="btn-secondary rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> Save against GSTR-1
          </button>
        </div>
        <button onClick={() => setSimple(false)} className="text-xs font-medium text-purple-700 flex items-center gap-1.5">
          <ChevronDown className="w-3 h-3" /> Show the detailed guide (dates, fees, marketplace, screen-by-screen steps)
        </button>
      </div>

      {!simple && (<>
      {/* Due dates and the cost of missing them */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarClock className="w-5 h-5 text-purple-700" />
          <h4 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Step 2 · Know your dates</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b" style={{ borderColor: 'hsl(var(--border))' }}>
              {['Form', 'What it is', 'Due'].map(h => (
                <th key={h} className="text-left p-2 text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {pack.due.returns.map(r => (
                <tr key={r.form} className="border-b" style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
                  <td className="p-2 font-medium">{r.form}</td>
                  <td className="p-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{r.label} · {r.note}</td>
                  <td className="p-2 whitespace-nowrap">{new Date(r.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <Stat label="Days Past Due" value={String(pack.fees.daysLate)} />
          <Stat label="Late Fee" value={inr(pack.fees.gstr1LateFee + pack.fees.gstr3bLateFee)} />
          <Stat label="Interest @18%" value={inr(pack.fees.interestOnNetTax)} />
          <Stat label="Total If Filed Today" value={inr(pack.fees.total)} />
        </div>
        <p className="text-xs mt-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Late fee runs at ₹50 a day (₹10 on a nil return) and interest is 18% a year on the tax you owe. Sales details were
          {' '}{pack.fees.daysGstr1Late} day(s) behind; interest counts from the summary return date. The caps depend on last
          year&apos;s turnover — enter it above for a tighter estimate. Government notifications move these dates, so confirm them on the portal.
        </p>
      </div>

      {/* Downloads */}
      <div className="glass-card rounded-2xl p-6">
        <h4 className="font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>Step 3 · Take the files</h4>
        <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Upload the JSON in the portal, or type the numbers from the sheets if your portal version refuses the file — the figures are the same.
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => downloadPack({ download: 'gstr1-json' })} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2">
            <FileJson className="w-4 h-4" /> Sales JSON for upload
          </button>
          <button onClick={() => downloadPack({ download: 'pack' })} className="btn-secondary rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2">
            <Download className="w-4 h-4" /> Everything (JSON)
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            ['b2b', 'B2B invoices'], ['b2c', 'B2C summary'], ['hsn', 'HSN / SAC'],
            ['3b-tables', 'All tables'], ['itc', 'Input credit'], ['issues', 'Fix list'],
          ].map(([key, label]) => (
            <button key={key} onClick={() => downloadPack({ download: 'sheet', sheet: key })}
              className="btn-secondary rounded-xl px-3 py-2 text-xs font-medium flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* The numbers to type in */}
      <div className="glass-card rounded-2xl p-6">
        <h4 className="font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>Step 4 · Match these on screen</h4>
        <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
          These are the figures the summary return asks for. Read them across before you press file.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b" style={{ borderColor: 'hsl(var(--border))' }}>
              {CELL_HEADS.map(h => (
                <th key={h} className="text-left p-2 text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {rows3b.map(([table, label, v], i) => (
                <tr key={i} className="border-b" style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
                  <td className="p-2 font-medium whitespace-nowrap">{table}</td>
                  <td className="p-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</td>
                  {typeof v === 'number'
                    ? <td className="p-2 text-right" colSpan={4}>{inr(v)}</td>
                    : <>
                      <td className="p-2 text-right">{inr(v.taxable || 0)}</td>
                      <td className="p-2 text-right">{inr(v.igst || 0)}</td>
                      <td className="p-2 text-right">{inr(v.cgst || 0)}</td>
                      <td className="p-2 text-right">{inr(v.sgst || 0)}</td>
                    </>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-4 rounded-xl" style={{ background: 'hsl(var(--secondary))' }}>
          <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Credit is used first, the rest is paid in cash</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span style={{ color: 'hsl(var(--foreground))' }}>From credit: <span className="font-semibold text-purple-700">{inr((pack.gstr3b.utilisation?.itcUsed?.igst || 0) + (pack.gstr3b.utilisation?.itcUsed?.cgst || 0) + (pack.gstr3b.utilisation?.itcUsed?.sgst || 0))}</span></span>
            <span style={{ color: 'hsl(var(--foreground))' }}>To pay in cash: <span className="font-semibold text-purple-700">{inr(pack.summary.netTaxPayable)}</span></span>
          </div>
          {pack.summary.creditCarriedForward > 0 && (
            <p className="text-xs mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {inr(pack.summary.creditCarriedForward)} of your credit could not be used here — CGST and SGST credit cannot pay an IGST
              liability. It stays in your credit ledger for the next period, so arrange the cash figure above.
            </p>
          )}
          {pack.gstr3b.notes.map((n, i) => (
            <p key={i} className="text-xs mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{n}</p>
          ))}
        </div>
      </div>

      {/* Portal walkthrough */}
      <div className="glass-card rounded-2xl p-6">
        <h4 className="font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>Step 5 · File it on the portal</h4>
        <p className="text-sm mb-5" style={{ color: 'hsl(var(--muted-foreground))' }}>
          The same sequence a filing agency runs for you. Menu names shift between portal releases, so go by the closest label you see.
        </p>
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <a href="https://services.gst.gov.in/service/login" target="_blank" rel="noopener noreferrer"
            className="btn-primary rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2">
            <ExternalLink className="w-4 h-4" /> Open the portal and sign in
          </a>
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            The sign-in OTP arrives on your own registered mobile and email — AINOS never sees it.
          </p>
        </div>
        <ol className="space-y-4">
          {pack.checklist.map(s => (
            <li key={s.n} className="flex gap-3">
              <span className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #4c1d95, #6d28d9)' }}>{s.n}</span>
              <div className="min-w-0">
                <p className="font-medium text-sm" style={{ color: 'hsl(var(--foreground))' }}>{s.title}</p>
                <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.detail}</p>
                {s.portalPath && (
                  <p className="text-xs mt-1 flex items-center gap-1.5 text-purple-700">
                    <ExternalLink className="w-3 h-3 shrink-0" /> {s.portalPath}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Nil month over SMS */}
      <div className="glass-card rounded-2xl p-6">
        <h4 className="font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>No sales this month? Close it from your phone</h4>
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          A month with nothing to report can be filed as a nil return by one text message from your registered mobile —
          no sign-in, no upload. The exact message format sits on the portal under Services → Returns → Returns filing
          through SMS. File it by SMS, then store the acknowledgement number below so AINOS marks the period closed.
        </p>
        <a href="https://www.gst.gov.in" target="_blank" rel="noopener noreferrer"
          className="text-xs mt-3 inline-flex items-center gap-1.5 text-purple-700 font-medium">
          <ExternalLink className="w-3 h-3" /> gst.gov.in → Services → Returns → Returns filing through SMS
        </a>
      </div>

      {/* Marketplace sellers */}
      <div className="glass-card rounded-2xl p-6">
        <h4 className="font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>Selling on Amazon, Flipkart or Meesho?</h4>
        <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Marketplace orders are not in your AINOS invoices, so download each report below and bring the sales into your invoice list, and the
          commission GST into your expenses — that commission tax is credit you can claim back.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b" style={{ borderColor: 'hsl(var(--border))' }}>
              {['Platform', 'Report to download', 'Where to find it', 'Where it goes'].map(h => (
                <th key={h} className="text-left p-2 text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {pack.marketplaceSources.map((s, i) => (
                <tr key={i} className="border-b" style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
                  <td className="p-2 font-medium whitespace-nowrap">{s.name}</td>
                  <td className="p-2">{s.report}</td>
                  <td className="p-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.where}</td>
                  <td className="p-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.mapsTo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record the ARN */}
      <div className="glass-card rounded-2xl p-6">
        <h4 className="font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>Step 6 · Close the period</h4>
        <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
          After the portal accepts the return it shows a 15-digit acknowledgement number. Store it here so this period is marked done.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Acknowledgement number</label>
            <input value={arn} onChange={e => setArn(e.target.value.replace(/\D/g, '').slice(0, 15))} inputMode="numeric"
              className="glass-input rounded-xl px-4 py-2.5 text-sm w-52" placeholder="15 digits" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Challan number</label>
            <input value={challanNo} onChange={e => setChallanNo(e.target.value)}
              className="glass-input rounded-xl px-4 py-2.5 text-sm w-44" placeholder="optional" />
          </div>
          <button onClick={() => recordFiled('GSTR1')} disabled={savingRecord || arn.length !== 15}
            className="btn-primary rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> Save against GSTR-1
          </button>
          <button onClick={() => recordFiled('GSTR3B')} disabled={savingRecord || arn.length !== 15}
            className="btn-secondary rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> Save against GSTR-3B
          </button>
        </div>
      </div>

      <button onClick={() => setSimple(true)} className="text-xs font-medium text-purple-700 mx-auto flex items-center gap-1.5">
        <ChevronUp className="w-3 h-3" /> Back to the simple view
      </button>
      </>
      )}
    </motion.div>
  );
}
