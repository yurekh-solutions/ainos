'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download } from 'lucide-react';

export default function GstReportsPage() {
  const [report, setReport] = useState<any>(null);
  const [type, setType] = useState('gstr1');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchReport = async () => {
    const res = await fetch(`/api/gst-reports?type=${type}&startDate=${startDate}&endDate=${endDate}`);
    if (res.ok) setReport(await res.json());
  };

  useEffect(() => { fetchReport(); }, []);

  return (
    <div className="min-h-screen p-6 sm:p-8" style={{ background: 'hsl(var(--page-gradient))' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>GST Reports</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>GSTR-1, GSTR-2, GSTR-3B reports</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Report Type</label>
              <select className="glass-input rounded-xl px-4 py-2.5 text-sm" value={type} onChange={e => setType(e.target.value)}>
                <option value="gstr1">GSTR-1 (Outward Supplies)</option>
                <option value="gstr2">GSTR-2 (Inward Supplies)</option>
                <option value="gstr3b">GSTR-3B (Summary)</option>
              </select>
            </div>
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg" style={{ color: 'hsl(var(--foreground))' }}>{report.type}</h3>
              <button className="btn-secondary rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2"><Download className="w-4 h-4" /> Export</button>
            </div>
            {report.totalTax !== undefined && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl" style={{ background: 'hsl(var(--secondary))' }}>
                  <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Tax</p>
                  <p className="text-xl font-bold text-purple-600">₹{(report.totalTax || 0).toLocaleString('en-IN')}</p>
                </div>
                {report.totalRevenue && (
                  <div className="p-4 rounded-xl" style={{ background: 'hsl(var(--secondary))' }}>
                    <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Revenue</p>
                    <p className="text-xl font-bold text-emerald-600">₹{(report.totalRevenue || 0).toLocaleString('en-IN')}</p>
                  </div>
                )}
                {report.totalExpenses !== undefined && (
                  <div className="p-4 rounded-xl" style={{ background: 'hsl(var(--secondary))' }}>
                    <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Expenses</p>
                    <p className="text-xl font-bold text-red-600">₹{(report.totalExpenses || 0).toLocaleString('en-IN')}</p>
                  </div>
                )}
              </div>
            )}
            {report.invoices && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                    <th className="text-left p-3 text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>Invoice</th>
                    <th className="text-left p-3 text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>Customer</th>
                    <th className="text-left p-3 text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>GSTIN</th>
                    <th className="text-right p-3 text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>Amount</th>
                    <th className="text-right p-3 text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>Tax</th>
                  </tr></thead>
                  <tbody>
                    {report.invoices.map((inv: any, i: number) => (
                      <tr key={i} className="border-b" style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
                        <td className="p-3 text-sm" style={{ color: 'hsl(var(--foreground))' }}>{inv.invoiceNumber}</td>
                        <td className="p-3 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{inv.customerName}</td>
                        <td className="p-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{inv.customerGstNumber || '-'}</td>
                        <td className="p-3 text-sm text-right font-medium" style={{ color: 'hsl(var(--foreground))' }}>₹{(inv.totalAmount || 0).toLocaleString('en-IN')}</td>
                        <td className="p-3 text-sm text-right text-purple-600">{((inv.cgstAmount || 0) + (inv.sgstAmount || 0) + (inv.igstAmount || 0)).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
