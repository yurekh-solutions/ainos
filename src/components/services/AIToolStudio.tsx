'use client';
// AINOS AI Tool Studio — the popup that EXECUTES a Yurekh service with AI.
// One config-driven modal for all tools: form → animated generation → real deliverable
// (copy, download, image assets, palettes) produced instantly by AINOS.
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Copy, Check, Download, RefreshCw, ExternalLink, Wand2, Users, Crown, Lightbulb } from 'lucide-react';

export type StudioToolId = 'logo' | 'brandkit' | 'social' | 'content' | 'seo' | 'email' | 'pr' | 'launch' | 'poster' | 'qr';

interface Field { id: string; label: string; type: 'text' | 'textarea' | 'select' | 'color'; options?: string[]; required?: boolean; placeholder?: string; }

interface ToolConfig { name: string; tagline: string; fields: Field[]; steps: string[]; }

const TOOL_CONFIGS: Record<StudioToolId, ToolConfig> = {
  logo: {
    name: 'AI Logo Designer', tagline: 'Generates 6 logo concepts for your brand',
    fields: [
      { id: 'businessName', label: 'Business name', type: 'text', required: true },
      { id: 'industry', label: 'Industry', type: 'text', required: true, placeholder: 'e.g. restaurant, tech, salon' },
      { id: 'colors', label: 'Preferred colors', type: 'text', placeholder: 'e.g. teal and gold' },
    ],
    steps: ['Studying your brand…', 'Sketching concepts…', 'Rendering 6 logo directions…'],
  },
  brandkit: {
    name: 'AI Brand Kit Generator', tagline: 'Palette, taglines, voice, typography & usage rules',
    fields: [
      { id: 'businessName', label: 'Business name', type: 'text', required: true },
      { id: 'industry', label: 'Industry', type: 'text', required: true },
      { id: 'primaryColor', label: 'Primary brand color', type: 'color' },
    ],
    steps: ['Analysing your positioning…', 'Building the color system…', 'Writing taglines & voice…'],
  },
  social: {
    name: 'AI Social Media Engine', tagline: '7-day content plan + captions + creatives',
    fields: [
      { id: 'businessName', label: 'Business name', type: 'text', required: true },
      { id: 'industry', label: 'Industry', type: 'text', required: true },
      { id: 'platform', label: 'Platform', type: 'select', options: ['Instagram', 'LinkedIn', 'Facebook', 'X (Twitter)'] },
      { id: 'topic', label: 'Focus topic', type: 'text', placeholder: 'e.g. new menu launch' },
    ],
    steps: ['Studying your audience…', 'Writing 7 days of captions…', 'Designing post creatives…'],
  },
  content: {
    name: 'AI Content Writer', tagline: 'Blog articles & ad copy, ready to publish',
    fields: [
      { id: 'businessName', label: 'Business name', type: 'text', required: true },
      { id: 'industry', label: 'Industry', type: 'text', required: true },
      { id: 'contentType', label: 'Content type', type: 'select', options: ['blog', 'ad'] },
      { id: 'topic', label: 'Topic', type: 'text', required: true, placeholder: 'What should it be about?' },
      { id: 'keywords', label: 'Keywords (optional)', type: 'text', placeholder: 'comma, separated' },
    ],
    steps: ['Researching the topic…', 'Structuring the piece…', 'Writing the copy…'],
  },
  seo: {
    name: 'AI SEO Toolkit', tagline: 'Meta tags, keywords, checklist & 30-day plan',
    fields: [
      { id: 'businessName', label: 'Business name', type: 'text', required: true },
      { id: 'industry', label: 'Industry', type: 'text', required: true },
      { id: 'pageTopic', label: 'Page / service to rank', type: 'text', required: true, placeholder: 'e.g. wedding photography' },
      { id: 'location', label: 'Target location', type: 'text', placeholder: 'e.g. Mumbai' },
      { id: 'keywords', label: 'Known keywords (optional)', type: 'text' },
    ],
    steps: ['Analysing search intent…', 'Generating meta tags…', 'Building your keyword map…'],
  },
  email: {
    name: 'AI Email Campaign Writer', tagline: 'Subject lines, body copy & send strategy',
    fields: [
      { id: 'businessName', label: 'Business name', type: 'text', required: true },
      { id: 'industry', label: 'Industry', type: 'text', required: true },
      { id: 'goal', label: 'Campaign goal', type: 'select', options: ['promotion', 'newsletter', 'welcome', 'win-back'] },
      { id: 'audience', label: 'Audience', type: 'text', placeholder: 'e.g. past customers' },
      { id: 'offer', label: 'Offer / message', type: 'text', placeholder: 'e.g. 20% off this month' },
    ],
    steps: ['Profiling your audience…', 'Writing subject lines…', 'Drafting the email…'],
  },
  pr: {
    name: 'AI Press Release Generator', tagline: 'Publication-ready release + media strategy',
    fields: [
      { id: 'businessName', label: 'Business name', type: 'text', required: true },
      { id: 'announcement', label: 'What are you announcing?', type: 'textarea', required: true, placeholder: 'e.g. launch of our new store in Bandra' },
      { id: 'spokesperson', label: 'Spokesperson name & title', type: 'text', placeholder: 'e.g. Priya Shah, Founder' },
      { id: 'city', label: 'City', type: 'text', placeholder: 'e.g. Mumbai' },
    ],
    steps: ['Structuring the story…', 'Writing the release…', 'Preparing media strategy…'],
  },
  launch: {
    name: 'AI Launch Blueprint', tagline: '8-week launch plan with phases & budget guidance',
    fields: [
      { id: 'businessName', label: 'Business name', type: 'text', required: true },
      { id: 'productName', label: 'Product / project to launch', type: 'text', required: true },
      { id: 'budgetLevel', label: 'Budget level', type: 'select', options: ['lean', 'standard', 'premium'] },
    ],
    steps: ['Mapping your market…', 'Sequencing the phases…', 'Writing your blueprint…'],
  },
  poster: {
    name: 'AI Print Creative Maker', tagline: 'Posters, flyers, banners & standees',
    fields: [
      { id: 'businessName', label: 'Business name', type: 'text', required: true },
      { id: 'industry', label: 'Industry', type: 'text', required: true },
      { id: 'message', label: 'Campaign message', type: 'text', required: true, placeholder: 'e.g. Grand opening 50% off' },
      { id: 'style', label: 'Style', type: 'select', options: ['modern', 'luxury', 'minimalist', 'retro', 'bold'] },
    ],
    steps: ['Setting the art direction…', 'Composing layouts…', 'Rendering 6 print formats…'],
  },
  qr: {
    name: 'QR Code Generator', tagline: 'Instant scannable QR codes, print-ready',
    fields: [
      { id: 'qrData', label: 'Link or text to encode', type: 'text', required: true, placeholder: 'https://your-website.com' },
      { id: 'qrColor', label: 'Code color', type: 'color' },
    ],
    steps: ['Encoding your data…', 'Rendering QR codes…'],
  },
};

// One-tap example inputs so a new user can see real value in under 10 seconds
const EXAMPLES: Record<StudioToolId, Record<string, string>> = {
  logo: { businessName: 'Brew Theory', industry: 'specialty coffee cafe', colors: 'teal and cream' },
  brandkit: { businessName: 'Brew Theory', industry: 'specialty coffee cafe', primaryColor: '#1BE1D3' },
  social: { businessName: 'Brew Theory', industry: 'cafe', platform: 'Instagram', topic: 'new winter menu launch' },
  content: { businessName: 'Brew Theory', industry: 'cafe', contentType: 'blog', topic: 'How to choose a great specialty coffee', keywords: 'specialty coffee, arabica, best cafe' },
  seo: { businessName: 'Brew Theory', industry: 'cafe', pageTopic: 'specialty coffee cafe', location: 'Mumbai' },
  email: { businessName: 'Brew Theory', industry: 'cafe', goal: 'promotion', audience: 'past customers', offer: '20% off the new winter menu this week' },
  pr: { businessName: 'Brew Theory', announcement: 'launch of our second outlet in Bandra, Mumbai', spokesperson: 'Priya Shah, Founder', city: 'Mumbai' },
  launch: { businessName: 'Brew Theory', productName: 'Winter specialty menu', budgetLevel: 'lean' },
  poster: { businessName: 'Brew Theory', industry: 'cafe', message: 'Grand opening — 50% off all week', style: 'modern' },
  qr: { qrData: 'https://yurekh.com', qrColor: '#000000' },
};

// Remembered business profile — fill once, prefilled in every tool afterwards
const PROFILE_KEY = 'ainos-tool-profile';
function savedProfile(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}'); } catch { return {}; }
}
function rememberProfile(inputs: Record<string, string>) {
  try {
    const keep: Record<string, string> = {};
    for (const k of ['businessName', 'industry', 'location', 'city']) if (inputs[k]) keep[k] = inputs[k];
    if (Object.keys(keep).length) localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...savedProfile(), ...keep }));
  } catch { /* storage unavailable — ignore */ }
}

interface ToolOutput {
  headline: string;
  sections?: { title: string; body: string }[];
  images?: { label: string; url: string }[];
  palette?: { hex: string; name: string }[];
  aiUsed?: boolean;
}

interface AIToolStudioProps {
  tool: StudioToolId;
  serviceName: string;
  onClose: () => void;
  onRequestTeam?: (serviceName: string) => void;
  // When provided, opens straight into the result phase (viewing a saved deliverable)
  initialOutput?: ToolOutput;
  initialInputs?: Record<string, string>;
}

export default function AIToolStudio({ tool, serviceName, onClose, onRequestTeam, initialOutput, initialInputs }: AIToolStudioProps) {
  const config = TOOL_CONFIGS[tool];
  const [phase, setPhase] = useState<'form' | 'generating' | 'result'>(initialOutput ? 'result' : 'form');
  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const profile = savedProfile();
    const prefill: Record<string, string> = {};
    // Only prefill fields this tool actually has
    for (const f of TOOL_CONFIGS[tool].fields) if (profile[f.id]) prefill[f.id] = profile[f.id];
    return { ...(tool === 'brandkit' ? { primaryColor: '#6d5df6' } : {}), ...(tool === 'qr' ? { qrColor: '#000000' } : {}), ...prefill, ...(initialInputs || {}) };
  });
  const [output, setOutput] = useState<ToolOutput | null>(initialOutput || null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [upgradeNeeded, setUpgradeNeeded] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const run = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setUpgradeNeeded(false);
    rememberProfile(inputs);
    setPhase('generating');
    setStep(0);
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, config.steps.length - 1)), 1800);
    try {
      const res = await fetch('/api/ai-tools', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool, inputs, serviceName }),
      });
      if (!res.ok) {
        const data = await res.json();
        if (res.status === 402) setUpgradeNeeded(true);
        throw new Error(data.error || 'Generation failed');
      }
      setOutput(await res.json());
      setPhase('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
      setPhase('form');
    } finally { clearInterval(timer); }
  };

  const copySection = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
  };

  const copyAll = async () => {
    if (!output) return;
    const text = [output.headline, ...(output.sections || []).map((s) => `## ${s.title}\n${s.body}`)].join('\n\n');
    await copySection(text, -1);
  };

  const downloadTxt = () => {
    if (!output) return;
    const text = [output.headline, ...(output.sections || []).map((s) => `== ${s.title} ==\n${s.body}`)].join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.name.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadImage = async (url: string, label: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = `${(inputs.businessName || 'ainos').toLowerCase().replace(/\s+/g, '-')}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
      a.click();
      URL.revokeObjectURL(objUrl);
    } catch {
      window.open(url, '_blank'); // CORS blocked — fall back to full-size view
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-3 sm:p-6" onClick={phase !== 'generating' ? onClose : undefined}>
      <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()}
        className={`glass-card rounded-2xl w-full overflow-hidden flex flex-col ${phase === 'result' ? 'max-w-3xl h-[92vh]' : 'max-w-lg max-h-[92vh]'}`}>

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: 'hsl(var(--border) / 0.4)' }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
              <Wand2 className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold leading-tight truncate" style={{ color: 'hsl(var(--foreground))' }}>{config.name}</h2>
              <p className="text-[11px] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{serviceName} · done by AINOS</p>
            </div>
          </div>
          {phase !== 'generating' && (
            <button onClick={onClose} className="p-2 rounded-xl hover:opacity-70 flex-shrink-0"><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button>
          )}
        </div>

        {/* ── Form ── */}
        {phase === 'form' && (
          <form onSubmit={run} className="p-5 space-y-3 overflow-y-auto">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{config.tagline}</p>
              <button type="button" onClick={() => setInputs({ ...inputs, ...EXAMPLES[tool] })}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold flex-shrink-0 border"
                style={{ borderColor: 'hsl(var(--primary) / 0.3)', color: 'hsl(var(--primary))', background: 'hsl(var(--primary) / 0.06)' }}>
                <Lightbulb className="w-3 h-3" /> Try an example
              </button>
            </div>
            {error && (
              <div className="text-xs px-3 py-2 rounded-lg space-y-2" style={{ background: 'rgba(244,63,94,0.12)', color: '#f43f5e' }}>
                <p>{error}</p>
                {upgradeNeeded && (
                  <Link href="/billing" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
                    <Crown className="w-3 h-3" /> View plans & upgrade
                  </Link>
                )}
              </div>
            )}
            {config.fields.map((f) => (
              <div key={f.id}>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{f.label}{f.required && ' *'}</label>
                {f.type === 'textarea' ? (
                  <textarea required={f.required} rows={3} placeholder={f.placeholder} value={inputs[f.id] || ''}
                    onChange={(e) => setInputs({ ...inputs, [f.id]: e.target.value })}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                ) : f.type === 'select' ? (
                  <select value={inputs[f.id] || f.options![0]} onChange={(e) => setInputs({ ...inputs, [f.id]: e.target.value })}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm capitalize">
                    {f.options!.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === 'color' ? (
                  <div className="flex items-center gap-3">
                    <input type="color" value={inputs[f.id] || '#6d5df6'} onChange={(e) => setInputs({ ...inputs, [f.id]: e.target.value })}
                      className="w-12 h-10 rounded-lg cursor-pointer bg-transparent" />
                    <span className="text-xs font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>{inputs[f.id] || '#6d5df6'}</span>
                  </div>
                ) : (
                  <input required={f.required} placeholder={f.placeholder} value={inputs[f.id] || ''}
                    onChange={(e) => setInputs({ ...inputs, [f.id]: e.target.value })}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                )}
              </div>
            ))}
            <button type="submit" className="w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
              <Sparkles className="w-4 h-4" /> Run Tool
            </button>
            <p className="text-[11px] text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>Instant · Saved to My Deliverables · Executed by AINOS AI</p>
          </form>
        )}

        {/* ── Generating ── */}
        {phase === 'generating' && (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
              <Sparkles className="w-7 h-7 text-white" />
            </motion.div>
            <h3 className="font-bold mb-1 text-sm" style={{ color: 'hsl(var(--foreground))' }}>{config.name} is working</h3>
            <AnimatePresence mode="wait">
              <motion.p key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{config.steps[step]}</motion.p>
            </AnimatePresence>
            <div className="w-full max-w-xs h-1.5 rounded-full mt-5 overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
              <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}
                initial={{ width: '10%' }} animate={{ width: `${((step + 1) / config.steps.length) * 92}%` }} transition={{ duration: 0.9 }} />
            </div>
          </div>
        )}

        {/* ── Result ── */}
        {phase === 'result' && output && (
          <>
            <div className="flex items-center gap-2 px-5 py-3 border-b flex-wrap flex-shrink-0" style={{ borderColor: 'hsl(var(--border) / 0.4)' }}>
              <span className="text-xs font-semibold mr-auto flex items-center gap-1.5" style={{ color: '#34d399' }}>
                <Check className="w-4 h-4" /> Deliverable ready
              </span>
              {output.sections && output.sections.length > 0 && (
                <>
                  <button onClick={copyAll} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}>
                    {copiedIdx === -1 ? <Check className="w-3.5 h-3.5" style={{ color: '#34d399' }} /> : <Copy className="w-3.5 h-3.5" />} Copy all
                  </button>
                  <button onClick={downloadTxt} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </>
              )}
              <button onClick={() => run()} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold"
                style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}>
                <RefreshCw className="w-3.5 h-3.5" /> Regenerate
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <h3 className="font-bold" style={{ color: 'hsl(var(--foreground))' }}>{output.headline}</h3>

              {/* Palette */}
              {output.palette && (
                <div className="flex flex-wrap gap-3">
                  {output.palette.map((c) => (
                    <button key={c.name} onClick={() => copySection(c.hex, -2)} title="Click to copy hex" className="text-center">
                      <div className="w-16 h-16 rounded-xl mb-1.5 border" style={{ background: c.hex, borderColor: 'hsl(var(--border) / 0.4)' }} />
                      <p className="text-[10px] font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{c.name}</p>
                      <p className="text-[10px] font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>{c.hex}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Images */}
              {output.images && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {output.images.map((im) => (
                    <div key={im.label} className="rounded-xl overflow-hidden border" style={{ borderColor: 'hsl(var(--border) / 0.4)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={im.url} alt={im.label} className="w-full aspect-square object-cover bg-white" loading="lazy" />
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{im.label}</span>
                        <div className="flex items-center gap-0.5">
                          <button onClick={() => downloadImage(im.url, im.label)} className="p-1.5 rounded-lg hover:opacity-70" title="Download PNG">
                            <Download className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />
                          </button>
                          <a href={im.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:opacity-70" title="Open full size">
                            <ExternalLink className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Text sections */}
              {output.sections?.map((s, idx) => (
                <div key={idx} className="rounded-xl p-4 border" style={{ borderColor: 'hsl(var(--border) / 0.4)', background: 'hsl(var(--muted) / 0.4)' }}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'hsl(var(--primary))' }}>{s.title}</h4>
                    <button onClick={() => copySection(s.body, idx)} className="p-1.5 rounded-lg hover:opacity-70 flex-shrink-0" title="Copy">
                      {copiedIdx === idx ? <Check className="w-3.5 h-3.5" style={{ color: '#34d399' }} /> : <Copy className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />}
                    </button>
                  </div>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: 'hsl(var(--foreground))' }}>{s.body}</p>
                </div>
              ))}

              {/* Team handoff */}
              {onRequestTeam && (
                <button onClick={() => onRequestTeam(serviceName)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border"
                  style={{ borderColor: 'hsl(var(--primary) / 0.3)', color: 'hsl(var(--primary))', background: 'hsl(var(--primary) / 0.06)' }}>
                  <Users className="w-3.5 h-3.5" /> Want the Yurekh team to take this further? Hand it off
                </button>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
