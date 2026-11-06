'use client';

import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ScanLine, Upload, FileSpreadsheet, Trash2, Loader2, CheckCircle2,
  AlertCircle, RefreshCw, ImagePlus,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PAGE, CONTAINER, CARD, fadeUp, IconCircle, PageHeader } from '@/components/dashboard/kit';

type RowStatus = 'queued' | 'scanning' | 'done' | 'error';

interface CardFields {
  name: string;
  designation: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  address: string;
}

interface CardRow {
  id: string;
  fileName: string;
  preview: string;
  status: RowStatus;
  fields: CardFields;
  error: string;
}

const EMPTY_FIELDS: CardFields = {
  name: '', designation: '', company: '', phone: '', email: '', website: '', address: '',
};

const FIELDS: { key: keyof CardFields; label: string; placeholder: string }[] = [
  { key: 'name', label: 'Name', placeholder: 'Full name' },
  { key: 'designation', label: 'Designation', placeholder: 'Role / title' },
  { key: 'company', label: 'Company', placeholder: 'Company / brand' },
  { key: 'phone', label: 'Phone', placeholder: 'Phone number' },
  { key: 'email', label: 'Email', placeholder: 'Email address' },
  { key: 'website', label: 'Website', placeholder: 'Website URL' },
  { key: 'address', label: 'Address', placeholder: 'Office address' },
];

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.readAsDataURL(file);
  });

export default function BusinessCardScannerPage() {
  const [rows, setRows] = useState<CardRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  const patchRow = useCallback((id: string, patch: Partial<CardRow>) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const scanOne = useCallback(async (row: CardRow) => {
    patchRow(row.id, { status: 'scanning', error: '' });
    try {
      const res = await fetch('/api/finance/business-cards/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: row.preview }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');
      const f = (data.fields || {}) as Partial<CardFields>;
      patchRow(row.id, {
        status: 'done',
        fields: {
          name: f.name ?? '', designation: f.designation ?? '', company: f.company ?? '',
          phone: f.phone ?? '', email: f.email ?? '', website: f.website ?? '', address: f.address ?? '',
        },
      });
    } catch (err) {
      patchRow(row.id, { status: 'error', error: err instanceof Error ? err.message : 'Scan failed' });
    }
  }, [patchRow]);

  const handleFiles = useCallback(async (fileList: File[]) => {
    const images = fileList.filter(f => f.type.startsWith('image/'));
    if (!images.length) { notify('Please choose image files (JPG / PNG)', 'error'); return; }

    const created: CardRow[] = [];
    for (const file of images) {
      try {
        const preview = await readFileAsDataUrl(file);
        created.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          fileName: file.name, preview, status: 'queued', fields: { ...EMPTY_FIELDS }, error: '',
        });
      } catch {
        // skip unreadable file
      }
    }
    if (!created.length) { notify('Could not read the selected files', 'error'); return; }

    setRows(prev => [...prev, ...created]);
    setBusy(true);
    // Sequential to stay gentle on the free vision tier.
    for (const row of created) {
      // eslint-disable-next-line no-await-in-loop
      await scanOne(row);
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  }, [scanOne]);

  const updateField = (id: string, key: keyof CardFields, value: string) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, fields: { ...r.fields, [key]: value } } : r)));
  };

  const removeRow = (id: string) => setRows(prev => prev.filter(r => r.id !== id));

  const rescanRow = (row: CardRow) => { void scanOne(row); };

  const clearAll = () => { setRows([]); notify('Cleared all cards'); };

  const exportExcel = () => {
    const done = rows.filter(r => r.status === 'done');
    if (!done.length) { notify('Nothing to export yet — scan some cards first', 'error'); return; }
    const sheet = done.map(r => ({
      'Name': r.fields.name,
      'Designation': r.fields.designation,
      'Company': r.fields.company,
      'Phone': r.fields.phone,
      'Email': r.fields.email,
      'Website': r.fields.website,
      'Address': r.fields.address,
    }));
    const ws = XLSX.utils.json_to_sheet(sheet);
    ws['!cols'] = [{ wch: 22 }, { wch: 20 }, { wch: 24 }, { wch: 18 }, { wch: 28 }, { wch: 26 }, { wch: 40 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Business Cards');
    XLSX.writeFile(wb, `AINOS_Business_Cards_${new Date().toISOString().split('T')[0]}.xlsx`);
    notify(`Exported ${done.length} card${done.length > 1 ? 's' : ''} to Excel`);
  };

  const doneCount = rows.filter(r => r.status === 'done').length;

  return (
    <div className={PAGE}>
      <div className={CONTAINER}>
        <PageHeader
          title="Business Card Scanner"
          subtitle="Scan business cards and turn them into clean contact data you can export to Excel."
        />

        {/* Upload zone */}
        <motion.section {...fadeUp(0.02)} className={CARD}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => !busy && fileRef.current?.click()}
            onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !busy) fileRef.current?.click(); }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault(); setDragOver(false);
              if (busy) return;
              void handleFiles(Array.from(e.dataTransfer.files));
            }}
            className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer
              ${dragOver ? 'border-violet-400 bg-violet-50' : 'border-neutral-200 hover:border-violet-300 hover:bg-[#faf8fd]'}`}
          >
            <IconCircle icon={busy ? Loader2 : ImagePlus} tone="purple" variant="gradient" size="lg" />
            <div>
              <p className="text-sm font-semibold text-neutral-800">
                {busy ? 'Scanning cards…' : 'Drop business card images here, or click to upload'}
              </p>
              <p className="text-xs text-neutral-500 mt-1">Upload one or many photos (JPG / PNG). Each card is read and filled in automatically.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-xl bg-[#4c1d95] px-4 py-2 text-sm font-semibold text-white">
              <Upload className="w-4 h-4" /> Upload cards
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => { const f = e.target.files; if (f) void handleFiles(Array.from(f)); }}
            />
          </div>
        </motion.section>

        {/* Results */}
        {rows.length > 0 && (
          <motion.section {...fadeUp(0.04)} className={`${CARD} overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <ScanLine className="w-4 h-4 text-[#6d28d9]" />
                <h2 className="text-sm font-bold text-neutral-800">Scanned cards</h2>
                <span className="text-xs text-neutral-500">· {doneCount} of {rows.length} ready</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={clearAll} className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50">
                  <Trash2 className="w-3.5 h-3.5" /> Clear all
                </button>
                <button onClick={exportExcel} className="inline-flex items-center gap-1.5 rounded-xl bg-[#4c1d95] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#5b21b6]">
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
                </button>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-neutral-500 bg-[#faf8fd]">
                    <th className="px-4 py-3 font-semibold w-[120px]">Card</th>
                    {FIELDS.map(f => <th key={f.key} className="px-3 py-3 font-semibold">{f.label}</th>)}
                    <th className="px-4 py-3 font-semibold text-right w-[92px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.id} className="border-t border-neutral-100 align-top">
                      <td className="px-4 py-3">
                        <div className="relative w-[104px] h-[62px] rounded-lg overflow-hidden bg-neutral-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={row.preview} alt={row.fileName} className="w-full h-full object-cover" />
                          {row.status === 'scanning' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                              <Loader2 className="w-5 h-5 animate-spin text-[#6d28d9]" />
                            </div>
                          )}
                        </div>
                        <StatusTag status={row.status} error={row.error} />
                      </td>
                      {FIELDS.map(f => (
                        <td key={f.key} className="px-3 py-3">
                          <input
                            value={row.fields[f.key]}
                            onChange={(e) => updateField(row.id, f.key, e.target.value)}
                            placeholder={row.status === 'scanning' ? '…' : f.placeholder}
                            disabled={row.status === 'scanning'}
                            className="w-full min-w-[130px] rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[13px] text-neutral-800 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-200 disabled:bg-neutral-50"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button title="Rescan" onClick={() => rescanRow(row)} disabled={row.status === 'scanning'}
                            className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40">
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button title="Delete" onClick={() => removeRow(row.id)}
                            className="rounded-lg p-2 text-neutral-500 hover:bg-rose-50 hover:text-rose-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / tablet cards */}
            <div className="lg:hidden divide-y divide-neutral-100">
              {rows.map(row => (
                <div key={row.id} className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-11 rounded-md overflow-hidden bg-neutral-100 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={row.preview} alt={row.fileName} className="w-full h-full object-cover" />
                      {row.status === 'scanning' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                          <Loader2 className="w-4 h-4 animate-spin text-[#6d28d9]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-500 truncate">{row.fileName}</p>
                      <StatusTag status={row.status} error={row.error} />
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => rescanRow(row)} disabled={row.status === 'scanning'}
                        className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button onClick={() => removeRow(row.id)} className="rounded-lg p-2 text-neutral-500 hover:bg-rose-50 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {FIELDS.map(f => (
                      <label key={f.key} className="block">
                        <span className="text-[11px] font-medium text-neutral-500">{f.label}</span>
                        <input
                          value={row.fields[f.key]}
                          onChange={(e) => updateField(row.id, f.key, e.target.value)}
                          placeholder={row.status === 'scanning' ? '…' : f.placeholder}
                          disabled={row.status === 'scanning'}
                          className="mt-0.5 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[13px] text-neutral-800 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-200 disabled:bg-neutral-50"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {rows.length === 0 && (
          <motion.div {...fadeUp(0.06)} className="text-center text-xs text-neutral-400 pt-2">
            No cards yet. Upload a photo of a business card to get started.
          </motion.div>
        )}
      </div>

      {toast && (
        <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg
          ${toast.type === 'success' ? 'bg-[#4c1d95] text-white' : 'bg-rose-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

function StatusTag({ status, error }: { status: RowStatus; error: string }) {
  if (status === 'scanning' || status === 'queued') {
    return <p className="mt-1.5 text-[11px] text-neutral-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> {status === 'queued' ? 'Queued' : 'Reading…'}</p>;
  }
  if (status === 'error') {
    return <p className="mt-1.5 text-[11px] text-rose-600 flex items-start gap-1"><AlertCircle className="w-3 h-3 mt-0.5 shrink-0" /> <span className="line-clamp-2">{error || 'Scan failed'}</span></p>;
  }
  return <p className="mt-1.5 text-[11px] text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Extracted</p>;
}
