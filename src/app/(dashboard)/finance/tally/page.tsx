'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSpreadsheet, Upload, Download, CheckCircle2, AlertCircle, AlertTriangle, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

interface Voucher {
  voucherType: string;
  voucherNumber: string;
  date: string;
  partyName: string;
  partyGst: string;
  partyState: string;
  items: { name: string; hsnCode: string; quantity: number; rate: number; gstRate: number; amount: number }[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  grandTotal: number;
  status: string;
}

interface ImportOutcome {
  rows?: number[];
  invoiceNumber?: string;
  partyName?: string;
  totalAmount?: number;
  supplyType?: string;
  reason?: string;
  warnings?: string[];
}

interface ImportReport {
  created: number;
  skipped: number;
  failed: number;
  details: ImportOutcome[];
  skippedDetails: ImportOutcome[];
  errorDetails: ImportOutcome[];
}

export default function TallyPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [company, setCompany] = useState<{ name: string; gstNumber: string }>({ name: '', gstNumber: '' });
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      const res = await fetch(`/api/tally?${params}`);
      if (res.ok) {
        const data = await res.json();
        setVouchers(data.vouchers || []);
        setCompany(data.company || { name: '', gstNumber: '' });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDownloadTemplate = () => {
    // Written the way the importer reads: one line per item, the same
    // "Voucher No" on both lines of a two-item bill, dates as dd-mm-yyyy.
    const template = [
      {
        'Voucher No': 'INV-001', 'Date': '15-01-2026', 'Party Name': 'Rajesh Enterprises',
        'Party GSTIN': '27AABCU9603R1ZM', 'Place of Supply': 'Maharashtra',
        'Item': 'Website Design', 'HSN': '9983', 'Qty': 1, 'Rate': 50000, 'GST%': 18,
        'Taxable Value': 50000, 'Status': 'Sent', 'Due Date': '14-02-2026', 'Paid Amount': 0,
      },
      {
        'Voucher No': 'INV-001', 'Date': '15-01-2026', 'Party Name': 'Rajesh Enterprises',
        'Item': 'Annual Maintenance', 'HSN': '9983', 'Qty': 12, 'Rate': 2500, 'GST%': 18,
        'Taxable Value': 30000,
      },
      {
        'Voucher No': 'INV-002', 'Date': '02-02-2026', 'Party Name': 'Delhi Traders',
        'Party GSTIN': '07ABCDE1234F1Z5', 'Place of Supply': 'Delhi',
        'Item': 'Consulting', 'HSN': '9983', 'Qty': 1, 'Rate': 40000, 'GST%': 18,
        'Taxable Value': 40000, 'Status': 'Paid', 'Paid Amount': 47200,
      },
    ];
    const guide = [
      { Column: 'Voucher No', Use: 'Your bill number. Same number on the next line = one bill with two items.' },
      { Column: 'Date', Use: 'dd-mm-yyyy, or a real Excel date. Leave empty for today.' },
      { Column: 'Party Name', Use: 'Required. Matched to an existing customer by GSTIN first, then by name.' },
      { Column: 'Party GSTIN', Use: 'Decides CGST+SGST vs IGST. Unregistered buyers: leave blank and give Place of Supply.' },
      { Column: 'Place of Supply', Use: 'State name or 2-digit code, used when there is no buyer GSTIN.' },
      { Column: 'Qty / Rate / GST%', Use: 'Taxable value = Qty x Rate. GST% may be 0, 5, 12, 18 or 28.' },
      { Column: 'Taxable Value', Use: 'Optional. Overrides Qty x Rate when your sheet already has the value.' },
      { Column: 'Status', Use: 'Sent, Paid, Partially Paid or Draft. Blank means Sent.' },
      { Column: 'Paid Amount', Use: 'Already received against this bill.' },
      { Column: 'Due Date', Use: 'Blank means 30 days after the bill date.' },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(template), 'Import Template');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(guide), 'How To Fill');
    XLSX.writeFile(wb, 'AINOS_Import_Template.xlsx');
    setToast({ message: 'Template downloaded. Fill it in and import it back.', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const handleExportExcel = () => {
    if (vouchers.length === 0) {
      setToast({ message: 'No data to export', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const rows = vouchers.map(v => ({
      'Voucher Type': v.voucherType,
      'Voucher No': v.voucherNumber,
      'Date': v.date,
      'Party Name': v.partyName,
      'Party GSTIN': v.partyGst,
      'Party State': v.partyState,
      'Subtotal': v.subtotal,
      'CGST': v.cgst,
      'SGST': v.sgst,
      'IGST': v.igst,
      'Total Tax': v.totalTax,
      'Grand Total': v.grandTotal,
      'Status': v.status,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Vouchers');
    XLSX.writeFile(wb, `AINOS_Tally_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    setToast({ message: 'Exported successfully!', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setReport(null);
    try {
      const buffer = await file.arrayBuffer();
      // cellDates keeps a real date cell as a date instead of the number
      // 46037, which is what silently killed rows before.
      const wb = XLSX.read(buffer, { cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

      if (rows.length === 0) throw new Error('That sheet has no rows to read.');

      const res = await fetch('/api/tally', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, source: file.name }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((result as { error?: string }).error || 'Import could not be completed');

      const reportData: ImportReport = {
        created: (result as ImportReport).created ?? 0,
        skipped: (result as ImportReport).skipped ?? 0,
        failed: (result as ImportReport).failed ?? 0,
        details: (result as ImportReport).details ?? [],
        skippedDetails: (result as ImportReport).skippedDetails ?? [],
        errorDetails: (result as ImportReport).errorDetails ?? [],
      };
      setReport(reportData);
      const notes = reportData.details.flatMap((d) => d.warnings ?? []);
      setToast({
        message: reportData.created
          ? `Imported ${reportData.created} invoice(s)` +
            (reportData.skipped ? `, skipped ${reportData.skipped}` : '') +
            (reportData.failed ? `, ${reportData.failed} not readable` : '')
          : (notes[0] || 'Nothing was imported - check the sheet headings against the Template'),
        type: reportData.created ? 'success' : 'error',
      });
      fetchData();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Import failed', type: 'error' });
    }
    setImporting(false);
    setTimeout(() => setToast(null), 5000);
    e.target.value = '';
  };

  const inputStyle = { background: 'hsl(var(--card-bg))', border: '1px solid hsl(var(--border) / 0.5)', color: 'hsl(var(--foreground))' };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3" style={{ color: 'hsl(var(--foreground))' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
              <FileSpreadsheet className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
            </div>
            Tally / Excel Data
          </h1>
          <p className="text-sm mt-1 ml-[52px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Import & export invoice data in Tally-compatible format
          </p>
        </div>

        {/* Actions */}
        <div className="glass-card p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>From</label>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm focus:outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>To</label>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm focus:outline-none" style={inputStyle} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                <Download className="w-4 h-4" /> Template
              </button>
              <button onClick={handleExportExcel}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                <Download className="w-4 h-4" /> Export Excel
              </button>
              <label className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium cursor-pointer transition-all"
                style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {importing ? 'Importing...' : 'Import Excel'}
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportExcel} className="hidden" />
              </label>
            </div>
          </div>

          {/* Company Info */}
          {company.name && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Company: <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>{company.name}</span>
                {company.gstNumber && <> | GSTIN: <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>{company.gstNumber}</span></>}
              </p>
            </div>
          )}

          {/* Without the seller's own registration nothing can tell an
              intra-state bill from an inter-state one, so say it up front. */}
          {company.name && !company.gstNumber && (
            <div className="mt-4 flex items-start gap-2 rounded-xl p-3"
              style={{ background: 'hsl(var(--primary) / 0.06)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'hsl(var(--primary))' }} />
              <p className="text-xs" style={{ color: 'hsl(var(--foreground))' }}>
                No GSTIN is saved for {company.name}, so imported bills are booked as intra-state (CGST + SGST) even when the buyer is in another state.
                {' '}<Link href="/company" className="font-semibold underline">Add your GSTIN</Link> before importing inter-state bills.
              </p>
            </div>
          )}
        </div>

        {/* What the last import actually did */}
        {report && (
          <div className="glass-card p-5">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Import result: {report.created} added{report.skipped ? `, ${report.skipped} already there` : ''}{report.failed ? `, ${report.failed} not read` : ''}
              </h2>
              <button onClick={() => setReport(null)} className="p-1 rounded-lg"
                style={{ color: 'hsl(var(--muted-foreground))' }} title="Dismiss">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-1.5 max-h-64 overflow-y-auto">
              {report.details.map((d, i) => (
                <div key={`ok-${i}`} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" />
                  <span style={{ color: 'hsl(var(--foreground))' }}>
                    <span className="font-medium">{d.invoiceNumber}</span>
                    {' '}{d.partyName} · ₹{Number(d.totalAmount ?? 0).toLocaleString('en-IN')} · {d.supplyType === 'inter' ? 'IGST' : 'CGST + SGST'}
                  </span>
                </div>
              ))}
              {report.details.flatMap((d, i) => (d.warnings ?? []).map((w, j) => (
                <div key={`w-${i}-${j}`} className="flex items-start gap-2 text-xs ml-[22px]">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>{w}</span>
                </div>
              )))}
              {report.skippedDetails.map((d, i) => (
                <div key={`skip-${i}`} className="flex items-start gap-2 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>{d.reason} — left as it is, so nothing was counted twice</span>
                </div>
              ))}
              {report.errorDetails.map((d, i) => (
                <div key={`err-${i}`} className="flex items-start gap-2 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: 'hsl(var(--destructive))' }} />
                  <span style={{ color: 'hsl(var(--foreground))' }}>{d.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vouchers Table */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto" style={{ borderColor: 'hsl(var(--border))', borderTopColor: 'hsl(var(--primary))' }} />
            </div>
          ) : vouchers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'hsl(var(--muted))' }}>
                    <th className="text-left py-3 px-4 text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>Voucher</th>
                    <th className="text-left py-3 px-4 text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>Party</th>
                    <th className="text-left py-3 px-4 text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>Date</th>
                    <th className="text-right py-3 px-4 text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>Subtotal</th>
                    <th className="text-right py-3 px-4 text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>Tax</th>
                    <th className="text-right py-3 px-4 text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>Total</th>
                    <th className="text-left py-3 px-4 text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((v, i) => (
                    <motion.tr key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="border-t hover:bg-[hsl(var(--muted))]" style={{ borderColor: 'hsl(var(--border))' }}>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{v.voucherNumber}</span>
                        <span className="block text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{v.voucherType}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>{v.partyName}</span>
                        {v.partyGst && <span className="block text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{v.partyGst}</span>}
                      </td>
                      <td className="py-3 px-4 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{v.date}</td>
                      <td className="py-3 px-4 text-right text-sm" style={{ color: 'hsl(var(--foreground))' }}>₹{v.subtotal?.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-right text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>₹{v.totalTax?.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-right text-sm font-semibold" style={{ color: 'hsl(var(--primary))' }}>₹{v.grandTotal?.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize border ${
                          v.status === 'paid' ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' :
                          v.status === 'sent' ? 'bg-blue-500/20 text-blue-600 border-blue-500/30' :
                          'bg-gray-500/20 text-gray-600 border-gray-500/30'
                        }`}>{v.status}</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <FileSpreadsheet className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <h3 className="text-lg font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>No data yet</h3>
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Bills you create in AINOS show up here, and bills from your old books come in through Import Excel.
              </p>
            </div>
          )}
        </div>

        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-6 left-1/2 z-[100] flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl"
              style={{ background: toast.type === 'success' ? 'hsl(142 76% 36%)' : 'hsl(0 72% 51%)', color: 'white' }}>
              {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
