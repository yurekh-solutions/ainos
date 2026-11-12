'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ScanLine, Upload, FileSpreadsheet, Trash2, Loader2, CheckCircle2,
  AlertCircle, RefreshCw, ImagePlus, UserPlus, Users,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PAGE, CONTAINER, CARD, fadeUp, IconCircle, PageHeader } from '@/components/dashboard/kit';

type RowStatus = 'queued' | 'scanning' | 'done' | 'error';
type SaveAction = 'created' | 'updated' | 'unchanged';

interface CardFields {
  name: string;
  designation: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  gstin: string;
}

interface SavedRef {
  action: SaveAction;
  id: string;
  name: string;
}

interface CardRow {
  id: string;
  fileName: string;
  preview: string;
  status: RowStatus;
  fields: CardFields;
  error: string;
  saving: boolean;
  saved: SavedRef | null;
  saveError: string;
}

const EMPTY_FIELDS: CardFields = {
  name: '', designation: '', company: '', phone: '', email: '', website: '', address: '', gstin: '',
};

const FIELDS: { key: keyof CardFields; label: string; placeholder: string }[] = [
  { key: 'name', label: 'Name', placeholder: 'Full name' },
  { key: 'designation', label: 'Designation', placeholder: 'Role / title' },
  { key: 'company', label: 'Company', placeholder: 'Company / brand' },
  { key: 'phone', label: 'Phone', placeholder: 'Phone number' },
  { key: 'email', label: 'Email', placeholder: 'Email address' },
  { key: 'gstin', label: 'GSTIN', placeholder: '27ABCDE1234F1Z5' },
  { key: 'website', label: 'Website', placeholder: 'Website URL' },
  { key: 'address', label: 'Address', placeholder: 'Office address' },
];

const SAVED_LABEL: Record<SaveAction, string> = {
  created: 'Added to Customers',
  updated: 'Filled a gap in Customers',
  unchanged: 'Already in Customers',
};

const AUTO_ADD_KEY = 'ainos.businessCards.autoAdd';

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
  const [autoAdd, setAutoAdd] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Read the saved preference after mount so the switch does not flash a
  // different state during server render.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTO_ADD_KEY);
      if (stored !== null) setAutoAdd(stored === '1');
    } catch {
      // A blocked storage access just keeps the default.
    }
  }, []);

  const toggleAutoAdd = () => {
    const next = !autoAdd;
    setAutoAdd(next);
    try { localStorage.setItem(AUTO_ADD_KEY, next ? '1' : '0'); } catch { /* preference is optional */ }
  };

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  const patchRow = useCallback((id: string, patch: Partial<CardRow>) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const scanOne = useCallback(async (row: CardRow): Promise<CardFields | null> => {
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
      const fields: CardFields = {
        name: f.name ?? '', designation: f.designation ?? '', company: f.company ?? '',
        phone: f.phone ?? '', email: f.email ?? '', website: f.website ?? '',
        address: f.address ?? '', gstin: f.gstin ?? '',
      };
      patchRow(row.id, { status: 'done', fields });
      return fields;
    } catch (err) {
      patchRow(row.id, { status: 'error', error: err instanceof Error ? err.message : 'Scan failed' });
      return null;
    }
  }, [patchRow]);

  // One card in, one customer out. The server decides whether this is a new
  // contact or one that is already in the books, so a re-scan is harmless.
  const saveRow = useCallback(async (row: CardRow): Promise<SavedRef | null> => {
    patchRow(row.id, { saving: true, saveError: '' });
    try {
      const res = await fetch('/api/finance/business-cards/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: row.fields }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save this card');
      const saved: SavedRef = { action: data.action as SaveAction, id: data.id, name: data.name };
      patchRow(row.id, { saving: false, saved });
      return saved;
    } catch (err) {
      patchRow(row.id, { saving: false, saveError: err instanceof Error ? err.message : 'Could not save this card' });
      return null;
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
          saving: false, saved: null, saveError: '',
        });
      } catch {
        // skip unreadable file
      }
    }
    if (!created.length) { notify('Could not read the selected files', 'error'); return; }

    setRows(prev => [...prev, ...created]);
    setBusy(true);
    // Sequential to stay gentle on the free vision tier.
    const scanned: CardRow[] = [];
    for (const row of created) {
      // eslint-disable-next-line no-await-in-loop
      const fields = await scanOne(row);
      if (fields) scanned.push({ ...row, fields });
    }

    let added = 0;
    if (autoAdd) {
      for (const row of scanned) {
        // eslint-disable-next-line no-await-in-loop
        if (await saveRow(row)) added++;
      }
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
    if (autoAdd && scanned.length) {
      notify(
        added
          ? `${added} of ${scanned.length} card${scanned.length > 1 ? 's' : ''} saved to Customers`
          : 'Cards scanned, but none could be saved — check the rows below',
        added ? 'success' : 'error',
      );
    }
  }, [scanOne, saveRow, autoAdd]);

  const updateField = (id: string, key: keyof CardFields, value: string) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, fields: { ...r.fields, [key]: value } } : r)));
  };

  const removeRow = (id: string) => setRows(prev => prev.filter(r => r.id !== id));

  const rescanRow = (row: CardRow) => { void scanOne(row); };

  const saveAll = async () => {
    const pending = rows.filter(r => r.status === 'done' && !r.saved && !r.saving);
    if (!pending.length) { notify('Every scanned card is already in Customers'); return; }
    setBusy(true);
    let added = 0;
    for (const row of pending) {
      // eslint-disable-next-line no-await-in-loop
      if (await saveRow(row)) added++;
    }
    setBusy(false);
    notify(added ? `${added} card${added > 1 ? 's' : ''} saved to Customers` : 'Nothing could be saved — check the rows below', added ? 'success' : 'error');
  };

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
      'GSTIN': r.fields.gstin,
      'Website': r.fields.website,
      'Address': r.fields.address,
    }));
    const ws = XLSX.utils.json_to_sheet(sheet);
    ws['!cols'] = [{ wch: 22 }, { wch: 20 }, { wch: 24 }, { wch: 18 }, { wch: 28 }, { wch: 20 }, { wch: 26 }, { wch: 40 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Business Cards');
    XLSX.writeFile(wb, `AINOS_Business_Cards_${new Date().toISOString().split('T')[0]}.xlsx`);
    notify(`Exported ${done.length} card${done.length > 1 ? 's' : ''} to Excel`);
  };

  const doneCount = rows.filter(r => r.status === 'done').length;
  const savedCount = rows.filter(r => r.saved).length;

  return (
    <div className={PAGE}>
      <div className={CONTAINER}>
        <PageHeader
          title="Business Card Scanner"
          subtitle="Scan business cards and turn them into clean contact data — saved into Customers as you upload, or exported to Excel."
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

          {/* Where the scanned data goes */}
          <div className="mt-4 flex items-start justify-between gap-4 rounded-xl border border-neutral-200 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-800">Add every scanned card to Customers</p>
              <p className="text-xs text-neutral-500 mt-1">
                As soon as a card is read it is saved under Finance › Customers. A contact you already
                have is filled in, not copied twice — and anything you typed yourself is never overwritten.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoAdd}
              aria-label="Add every scanned card to Customers"
              onClick={toggleAutoAdd}
              className={`shrink-0 rounded-full p-0.5 transition-colors w-11 h-6 ${autoAdd ? 'bg-[#4c1d95]' : 'bg-neutral-200'}`}
            >
              <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${autoAdd ? 'translate-x-[20px]' : 'translate-x-0'}`} />
            </button>
          </div>
        </motion.section>

        {/* Results */}
        {rows.length > 0 && (
          <motion.section {...fadeUp(0.04)} className={`${CARD} overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <ScanLine className="w-4 h-4 text-[#6d28d9]" />
                <h2 className="text-sm font-bold text-neutral-800">Scanned cards</h2>
                <span className="text-xs text-neutral-500">· {doneCount} of {rows.length} ready{savedCount > 0 ? ` · ${savedCount} in Customers` : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={clearAll} className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50">
                  <Trash2 className="w-3.5 h-3.5" /> Clear all
                </button>
                <button onClick={() => void saveAll()} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 px-3 py-2 text-xs font-semibold text-[#6d28d9] hover:bg-violet-50 disabled:opacity-50">
                  <UserPlus className="w-3.5 h-3.5" /> Save all to Customers
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
                    <th className="px-4 py-3 font-semibold text-right w-[124px]">Actions</th>
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
                        <StatusTag status={row.status} error={row.error} saving={row.saving} saved={row.saved} saveError={row.saveError} />
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
                          <SaveControl row={row} onSave={(r) => { void saveRow(r); }} />
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
                      <StatusTag status={row.status} error={row.error} saving={row.saving} saved={row.saved} saveError={row.saveError} />
                    </div>
                    <div className="flex items-center gap-1">
                      <SaveControl row={row} onSave={(r) => { void saveRow(r); }} />
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

function StatusTag({ status, error, saving, saved, saveError }: {
  status: RowStatus; error: string; saving: boolean; saved: SavedRef | null; saveError: string;
}) {
  if (status === 'scanning' || status === 'queued') {
    return <p className="mt-1.5 text-[11px] text-neutral-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> {status === 'queued' ? 'Queued' : 'Reading…'}</p>;
  }
  if (status === 'error') {
    return <p className="mt-1.5 text-[11px] text-rose-600 flex items-start gap-1"><AlertCircle className="w-3 h-3 mt-0.5 shrink-0" /> <span className="line-clamp-2">{error || 'Scan failed'}</span></p>;
  }
  return (
    <div className="mt-1.5 space-y-0.5">
      <p className="text-[11px] text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Extracted</p>
      {saving && <p className="text-[11px] text-neutral-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving…</p>}
      {saved && !saving && (
        <Link href="/customers" className="text-[11px] font-medium text-[#6d28d9] hover:underline flex items-center gap-1">
          <Users className="w-3 h-3" /> {SAVED_LABEL[saved.action]}
        </Link>
      )}
      {saveError && !saving && (
        <p className="text-[11px] text-amber-700 flex items-start gap-1"><AlertCircle className="w-3 h-3 mt-0.5 shrink-0" /> <span className="line-clamp-2">{saveError}</span></p>
      )}
    </div>
  );
}

// One control per card: add it to Customers, then a tick once it is there.
function SaveControl({ row, onSave }: { row: CardRow; onSave: (row: CardRow) => void }) {
  if (row.saved) {
    return (
      <button title={SAVED_LABEL[row.saved.action]} onClick={() => onSave(row)}
        className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50">
        <Users className="w-4 h-4" />
      </button>
    );
  }
  return (
    <button title="Add to Customers" onClick={() => onSave(row)} disabled={row.status !== 'done' || row.saving}
      className="rounded-lg p-2 text-neutral-500 hover:bg-violet-50 hover:text-[#6d28d9] disabled:opacity-40">
      {row.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
    </button>
  );
}
