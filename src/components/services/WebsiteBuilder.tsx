'use client';
// Yurekh AI Website Builder — Lovable/Replit-style popup: describe your business,
// watch it generate, preview live, download the finished website.
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Download, Copy, ExternalLink, RefreshCw, Check, Wand2 } from 'lucide-react';

interface WebsiteBuilderProps {
  siteType: string;
  onClose: () => void;
  onGenerated?: () => void;
}

const THEME_OPTIONS = [
  { id: 'modern', label: 'Modern Dark', swatch: 'linear-gradient(135deg,#0b0d14,#1d2233)' },
  { id: 'minimal', label: 'Minimal Light', swatch: 'linear-gradient(135deg,#ffffff,#e9ecf2)' },
  { id: 'bold', label: 'Bold', swatch: 'linear-gradient(135deg,#12060f,#3d1030)' },
] as const;

const COLOR_PRESETS = ['#6d5df6', '#1BE1D3', '#f43f5e', '#f59e0b', '#22c55e', '#3b82f6'];

const GEN_STEPS = [
  'Understanding your business…',
  'Designing the layout…',
  'Writing your copy with AI…',
  'Generating hero imagery…',
  'Assembling your website…',
];

export default function WebsiteBuilder({ siteType, onClose, onGenerated }: WebsiteBuilderProps) {
  const [phase, setPhase] = useState<'form' | 'generating' | 'preview'>('form');
  const [form, setForm] = useState({
    businessName: '', industry: '', description: '', email: '', phone: '', address: '',
    theme: 'modern' as string, primaryColor: '#6d5df6',
  });
  const [genStep, setGenStep] = useState(0);
  const [html, setHtml] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (stepTimer.current) clearInterval(stepTimer.current); }, []);

  const startGeneration = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setPhase('generating');
    setGenStep(0);
    stepTimer.current = setInterval(() => setGenStep((s) => Math.min(s + 1, GEN_STEPS.length - 1)), 2200);
    try {
      const res = await fetch('/api/ai-builder', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, siteType }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Generation failed');
      const data = await res.json();
      setHtml(data.html);
      setPhase('preview');
      onGenerated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setPhase('form');
    } finally {
      if (stepTimer.current) clearInterval(stepTimer.current);
    }
  };

  const downloadHtml = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.businessName.trim().toLowerCase().replace(/\s+/g, '-') || 'website'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openFullscreen = () => {
    const blob = new Blob([html], { type: 'text/html' });
    window.open(URL.createObjectURL(blob), '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6" onClick={phase !== 'generating' ? onClose : undefined}>
      <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()}
        className={`glass-card rounded-2xl w-full overflow-hidden flex flex-col ${phase === 'preview' ? 'max-w-6xl h-[92vh]' : 'max-w-xl max-h-[92vh]'}`}>

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: 'hsl(var(--border) / 0.4)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
              <Wand2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold leading-tight" style={{ color: 'hsl(var(--foreground))' }}>AI Website Builder</h2>
              <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{siteType} · Powered by Yurekh</p>
            </div>
          </div>
          {phase !== 'generating' && (
            <button onClick={onClose} className="p-2 rounded-xl hover:opacity-70"><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button>
          )}
        </div>

        {/* ── Form phase ── */}
        {phase === 'form' && (
          <form onSubmit={startGeneration} className="p-5 space-y-3 overflow-y-auto">
            {error && <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(244,63,94,0.12)', color: '#f43f5e' }}>{error}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input required placeholder="Business name *" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
              <input required placeholder="Industry (e.g. restaurant, salon) *" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
            </div>
            <textarea placeholder="Describe your business — what you do, who you serve, what makes you special…" value={form.description} rows={3}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="email" placeholder="Contact email (shown on site)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
              <input placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
            </div>
            <input placeholder="Address (optional)" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />

            {/* Theme picker */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Design style</p>
              <div className="grid grid-cols-3 gap-2">
                {THEME_OPTIONS.map((t) => (
                  <button type="button" key={t.id} onClick={() => setForm({ ...form, theme: t.id })}
                    className="rounded-xl p-2 text-center transition-all"
                    style={{ border: form.theme === t.id ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border) / 0.5)' }}>
                    <div className="h-9 rounded-lg mb-1.5" style={{ background: t.swatch }} />
                    <span className="text-[11px] font-medium" style={{ color: 'hsl(var(--foreground))' }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Brand color</p>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_PRESETS.map((c) => (
                  <button type="button" key={c} onClick={() => setForm({ ...form, primaryColor: c })}
                    className="w-8 h-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                    style={{ background: c, border: form.primaryColor === c ? '2px solid hsl(var(--foreground))' : '2px solid transparent' }}>
                    {form.primaryColor === c && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
                <input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="w-8 h-8 rounded-full cursor-pointer bg-transparent" title="Custom color" />
              </div>
            </div>

            <button type="submit" className="w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
              <Sparkles className="w-4 h-4" /> Generate My Website
            </button>
            <p className="text-[11px] text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>Free instant generation · Download & host anywhere · Yurekh can customize it further for you</p>
          </form>
        )}

        {/* ── Generating phase ── */}
        {phase === 'generating' && (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2.4, ease: 'linear' }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className="font-bold mb-1" style={{ color: 'hsl(var(--foreground))' }}>Building {form.businessName}&apos;s website</h3>
            <AnimatePresence mode="wait">
              <motion.p key={genStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{GEN_STEPS[genStep]}</motion.p>
            </AnimatePresence>
            <div className="w-full max-w-xs h-1.5 rounded-full mt-6 overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
              <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}
                initial={{ width: '8%' }} animate={{ width: `${((genStep + 1) / GEN_STEPS.length) * 95}%` }} transition={{ duration: 1 }} />
            </div>
          </div>
        )}

        {/* ── Preview phase ── */}
        {phase === 'preview' && (
          <>
            <div className="flex items-center gap-2 px-5 py-3 border-b flex-wrap flex-shrink-0" style={{ borderColor: 'hsl(var(--border) / 0.4)' }}>
              <span className="text-xs font-semibold mr-auto flex items-center gap-1.5" style={{ color: '#34d399' }}>
                <Check className="w-4 h-4" /> Website ready
              </span>
              <button onClick={downloadHtml} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
                <Download className="w-3.5 h-3.5" /> Download
              </button>
              <button onClick={copyCode} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold"
                style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}>
                {copied ? <Check className="w-3.5 h-3.5" style={{ color: '#34d399' }} /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied!' : 'Copy code'}
              </button>
              <button onClick={openFullscreen} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold"
                style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}>
                <ExternalLink className="w-3.5 h-3.5" /> Full screen
              </button>
              <button onClick={() => startGeneration()} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold"
                style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}>
                <RefreshCw className="w-3.5 h-3.5" /> Regenerate
              </button>
            </div>
            <iframe srcDoc={html} title="Website preview" className="w-full flex-1 bg-white" sandbox="allow-same-origin" />
          </>
        )}
      </motion.div>
    </div>
  );
}
