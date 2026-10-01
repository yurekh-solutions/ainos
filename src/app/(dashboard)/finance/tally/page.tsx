'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSpreadsheet, Upload, Download, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
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

export default function TallyPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [company, setCompany] = useState<{ name: string; gstNumber: string }>({ name: '', gstNumber: '' });
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
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
    const template = [{
      'Voucher No': 'INV-001',
      'Date': '2026-01-15',
      'Party Name': 'Rajesh Enterprises',
      'Party GSTIN': '27AABCU9603R1ZM',
      'Party State': 'Maharashtra',
      'Item': 'Website Design',
      'Qty': 1,
      'Rate': 50000,
      'GST%': 18,
      'Amount': 59000,
    }];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Import Template');
    XLSX.writeFile(wb, 'AINOS_Import_Template.xlsx');
    setToast({ message: 'Template downloaded! Fill it and re-import.', type: 'success' });
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
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[];

      // Parse Excel rows into voucher format
      const vouchers = data.map(row => ({
        voucherNumber: String(row['Voucher No'] || row['Invoice No'] || ''),
        date: String(row['Date'] || ''),
        partyName: String(row['Party Name'] || row['Customer'] || ''),
        partyGst: String(row['Party GSTIN'] || row['GSTIN'] || ''),
        partyState: String(row['Party State'] || row['State'] || ''),
        items: [{
          name: String(row['Item'] || row['Product'] || 'Item'),
          quantity: Number(row['Qty'] || row['Quantity'] || 1),
          rate: Number(row['Rate'] || row['Price'] || 0),
          gstRate: Number(row['GST%'] || row['GST Rate'] || 18),
        }],
        grandTotal: Number(row['Amount'] || row['Total'] || 0),
      })).filter(v => v.partyName);

      const res = await fetch('/api/tally', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vouchers }),
      });

      if (res.ok) {
        const result = await res.json();
        setToast({ message: `Imported ${result.created} invoices!`, type: 'success' });
        fetchData();
      }
    } catch {
      setToast({ message: 'Import failed', type: 'error' });
    }
    setImporting(false);
    setTimeout(() => setToast(null), 3000);
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
        </div>

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
              <h3 className="text-lg font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>No data</h3>
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Create invoices or import from Excel</p>
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
