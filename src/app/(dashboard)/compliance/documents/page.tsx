'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, FileText, Download, Calendar } from 'lucide-react';

interface Document { _id: string; name: string; type: string; url?: string; expiryDate?: string; uploadedAt: string; }

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'contract', url: '', expiryDate: '' });

  useEffect(() => { fetchDocuments(); }, []);

  const fetchDocuments = async () => {
    try { const res = await fetch('/api/documents'); if (res.ok) setDocuments(await res.json()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { setForm({ name: '', type: 'contract', url: '', expiryDate: '' }); setShowForm(false); fetchDocuments(); }
    } catch (e) { console.error(e); }
  };

  const typeIcons: Record<string, string> = { contract: '📄', license: '📜', certificate: '🏆', policy: '📋', other: '📁' };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div><h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Documents</h1><p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Legal & compliance documents</p></div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)', boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)' }}>
            <Plus className="w-4 h-4" /> Add Document
          </motion.button>
        </motion.div>

        {loading ? <div className="text-center py-20" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
          : documents.length === 0 ? (
            <div className="text-center py-20"><FileText className="w-12 h-12 mx-auto mb-3" style={{ color: 'hsl(var(--primary) / 0.3)' }} /><p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>No documents yet</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc, i) => (
                <motion.div key={doc._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass-card p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-2xl">{typeIcons[doc.type] || '📁'}</div>
                    <div className="flex-1"><h3 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{doc.name}</h3><p className="text-xs capitalize mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{doc.type}</p></div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs flex items-center gap-1" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}><Calendar className="w-3 h-3" />Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                    {doc.expiryDate && <p className="text-xs flex items-center gap-1" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}><Calendar className="w-3 h-3" />Expires: {new Date(doc.expiryDate).toLocaleDateString()}</p>}
                    {doc.url && <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 mt-2 hover:underline" style={{ color: 'hsl(var(--primary))' }}><Download className="w-3 h-3" />Download</a>}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}
              className="glass-card p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Add Document</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl transition-colors" style={{ color: 'hsl(var(--muted-foreground))' }}><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input required placeholder="Document name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                  <option value="contract">Contract</option><option value="license">License</option><option value="certificate">Certificate</option><option value="policy">Policy</option><option value="other">Other</option>
                </select>
                <input placeholder="Document URL" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                <input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)' }}>Add Document</button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
