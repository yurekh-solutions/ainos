'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Download, Video, Volume2, VolumeX, Heart,
  ChevronLeft, ChevronRight, Check, X,
} from 'lucide-react';
import { TEMPLATES } from '@/data/invitations/templates';
import FieldEditor from '../../components/FieldEditor';
import {
  TEXT_COLORS, COLOR_GROUPS, TEXT_STYLES, TEXT_BOARDS, BOARD_CHOICES,
  VIDEO_BOARD_STYLES, MUSIC_STYLES, TEXT_STACK,
  PREVIEW_CARD_WIDTH, VIDEO_HEIGHT, VIDEO_SCALE,
  clampBand, hexLuminance, contrastAgainst, analyzeTextBand,
  TEMPLATE_IMAGES, getFestivalFields,
  type BandResult,
} from '../customizeConstants';
import { SAMPLE_TEXT, getDefaultSample } from '../sampleText';
import { generateBackgroundMusic } from '../musicEngine';
import { generateAnimatedVideo, type VideoTextBlock } from '../videoGenerator';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Simple toast replacement ──
type ToastMsg = { id: number; text: string; type: 'success' | 'error' | 'info' };
let toastId = 0;
function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const push = useCallback((text: string, type: ToastMsg['type'] = 'info') => {
    const id = ++toastId;
    setToasts(t => [...t, { id, text, type }]);
    setTimeout(() => setToasts(t => t.filter(m => m.id !== id)), 3200);
  }, []);
  const success = useCallback((t: string) => push(t, 'success'), [push]);
  const error = useCallback((t: string) => push(t, 'error'), [push]);
  return { toasts, success, error, info: push };
}

const ToastBar = ({ toasts }: { toasts: ToastMsg[] }) => (
  <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id} className={`px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium animate-in fade-in slide-in-from-right-4 duration-300 ${
        t.type === 'success' ? 'bg-green-600 text-white' : t.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-800 text-white dark:bg-white dark:text-gray-900'
      }`}>{t.text}</div>
    ))}
  </div>
);

// ── Payment helpers (localStorage) ──
const PAID_KEY = 'ainos_invitation_paid';
const getPaidTemplates = (): Record<string, string> => { try { return JSON.parse(localStorage.getItem(PAID_KEY) || '{}'); } catch { return {}; } };
const isPaidFor = (slug: string, type: string) => { const p = getPaidTemplates(); return p[slug] === 'video' || p[slug] === type; };
const markPaid = (slug: string, type: string) => { const p = getPaidTemplates(); if (p[slug] !== 'video') p[slug] = type; localStorage.setItem(PAID_KEY, JSON.stringify(p)); };

// ── Template list for navigation ──
const navTemplates = TEMPLATES.map(t => ({ id: t._id, slug: t.slug, category: t.category, name: t.name, price: t.price, videoPrice: t.videoPrice, previewImage: t.previewImage, recommendedColor: t.recommendedColor }));

export default function CustomizePage() {
  const { templateId } = useParams<{ templateId: string }>();
  const router = useRouter();
  const id = templateId;
  const previewRef = useRef<HTMLDivElement>(null);
  const { toasts, success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const [template, setTemplate] = useState<typeof navTemplates[0] | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fieldFonts, setFieldFonts] = useState<Record<string, string>>({});
  const [fieldSizes, setFieldSizes] = useState<Record<string, number>>({});
  const [userTextColor, setUserTextColor] = useState<string | null>(null);
  const [customTextColor, setCustomTextColor] = useState<string | null>(null);
  const [textStyleId, setTextStyleId] = useState('classic');
  const [textBoardId, setTextBoardId] = useState<string | null>(null);
  const [musicStyle, setMusicStyle] = useState('auto');
  const [musicPlaying, setMusicPlaying] = useState(false);
  const musicCtxRef = useRef<AudioContext | null>(null);
  const [autoBand, setAutoBand] = useState<BandResult>({ start: 6, end: 52, luminance: 235, busy: false });
  const [textNudge, setTextNudge] = useState(0);
  const [previewWidth, setPreviewWidth] = useState(PREVIEW_CARD_WIDTH);
  const [includeAudio, setIncludeAudio] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [paymentModal, setPaymentModal] = useState<{ type: string; amount: number } | null>(null);
  const [paying, setPaying] = useState(false);
  const [language, setLanguage] = useState('english');

  // Load sample text when language changes
  useEffect(() => {
    if (template) {
      const cat = template.category || 'ganpati';
      const sample = SAMPLE_TEXT[cat]?.[language] || getDefaultSample(cat, language);
      queueMicrotask(() => setFormData(sample));
    }
  }, [language, template]);

  // Reset look-and-feel on template switch
  useEffect(() => { queueMicrotask(() => { setUserTextColor(null); setCustomTextColor(null); setTextStyleId('classic'); setTextBoardId(null); setFieldFonts({}); setFieldSizes({}); }); }, [id]);

  // Find template
  useEffect(() => {
    if (!id) { router.push('/marketing/invitations'); return; }
    const found = navTemplates.find(t => t.id === id || t.slug === id);
    if (found) {
      const full = TEMPLATES.find(t => t._id === found.id || t.slug === found.slug);
      queueMicrotask(() => {
        setTemplate({ ...found, previewImage: full?.previewImage || found.previewImage || '/templates/ganpati-01.png', recommendedColor: full?.recommendedColor || 'royal-maroon' });
        setLoading(false);
      });
    } else { queueMicrotask(() => setLoading(false)); }
  }, [id, router]);

  const category = template?.category || 'ganpati';
  const templateColor = template?.recommendedColor && TEXT_COLORS[template.recommendedColor] ? template.recommendedColor : 'royal-maroon';

  // Board & colour logic
  const activeBoardId = textBoardId || (autoBand.busy ? 'cream' : 'none');
  const board = TEXT_BOARDS.find(b => b.id === activeBoardId) || TEXT_BOARDS[0];
  const boardStyle = VIDEO_BOARD_STYLES[board.id];
  const groundLuminance = boardStyle ? (board.dark ? 30 : 240) : autoBand.luminance;
  const contrastTarget = boardStyle ? 4.5 : 3.6;
  const colourPool = (() => {
    if (!boardStyle) return TEXT_COLORS;
    const pool: typeof TEXT_COLORS = {};
    Object.entries(TEXT_COLORS).forEach(([key, val]) => { const lum = hexLuminance(val.color); if (board.dark ? lum > 150 : lum < 165) pool[key] = val; });
    return Object.keys(pool).length ? pool : TEXT_COLORS;
  })();
  const autoColorKey = (() => {
    const recLum = hexLuminance(TEXT_COLORS[templateColor].color);
    const recContrast = contrastAgainst(recLum, groundLuminance);
    if (recContrast >= contrastTarget) return templateColor;
    let bestKey = templateColor, bestC = recContrast;
    Object.entries(colourPool).forEach(([key, val]) => { const c = contrastAgainst(hexLuminance(val.color), groundLuminance); if (c > bestC) { bestC = c; bestKey = key; } });
    return bestKey;
  })();
  const userColorKey = customTextColor ? null : userTextColor;
  const activeTextColor = customTextColor ? null : (userColorKey || autoColorKey);
  const textColorValue = customTextColor || (activeTextColor ? TEXT_COLORS[activeTextColor]?.color : undefined) || TEXT_COLORS[autoColorKey]?.color || '#800020';
  const textIsLight = hexLuminance(textColorValue) > groundLuminance;
  const haloAlpha = boardStyle ? 0.28 : 0.9;
  const textHalo = textIsLight ? `rgba(0,0,0,${Math.min(0.65, 0.72 * haloAlpha + 0.08)})` : `rgba(255,255,255,${Math.min(0.92, 0.98 * haloAlpha + 0.06)})`;
  const textOutline = textIsLight ? `rgba(0,0,0,${0.5 * haloAlpha})` : `rgba(255,255,255,${0.85 * haloAlpha})`;
  const boardCss = board.id === 'none' ? null : board.css;
  const templateImage = template?.previewImage || TEMPLATE_IMAGES[category] || '/templates/ganpati-01.png';

  // Analyse artwork for best text band
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => setTextNudge(0));
    analyzeTextBand(templateImage).then(band => { if (!cancelled && band) setAutoBand(band); });
    return () => { cancelled = true; };
  }, [templateImage]);

  const textBand = { start: clampBand(autoBand.start + textNudge, 2, 90), end: clampBand(autoBand.end + textNudge, 10, 97) };
  const currentIndex = Math.max(0, navTemplates.findIndex(t => t.slug === id || t.id === id));
  const totalTemplates = navTemplates.length;
  const goToTemplate = (idx: number) => { const next = navTemplates[(idx + totalTemplates) % totalTemplates]; if (next) router.push(`/marketing/invitations/customize/${next.slug}`); };

  const handleFieldChange = (key: string, value: string) => setFormData(prev => ({ ...prev, [key]: value }));
  const handleFontChange = (key: string, font: string) => setFieldFonts(prev => ({ ...prev, [key]: font }));
  const handleSizeChange = (key: string, size: number) => setFieldSizes(prev => ({ ...prev, [key]: size }));
  const applyTextStyle = (styleId: string) => { const s = TEXT_STYLES.find(s => s.id === styleId); if (!s) return; setTextStyleId(styleId); setFieldFonts({ ...s.fonts }); };
  const baseSizeFor = (key: string) => { if (key === 'groomName' || key === 'brideName') return TEXT_STACK.find(i => i.key === '__couple')?.size || 21; return TEXT_STACK.find(i => i.key === key)?.size || 15; };

  // Preview width tracking
  useEffect(() => {
    const el = previewRef.current; if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(entries => { const w = entries[0]?.contentRect?.width; if (w) setPreviewWidth(w); });
    ro.observe(el); return () => ro.disconnect();
  }, [template]);
  const previewScale = previewWidth / PREVIEW_CARD_WIDTH;

  // Text blocks for preview
  const getTextBlocks = () => TEXT_STACK.reduce<{ key: string; text: string; size: number; font: string; weight: number; opacity: number; letterSpacing: string; gap: number; lines: number }[]>((acc, item) => {
    const styleKey = item.key === '__couple' ? 'groomName' : item.key;
    let text: string | undefined;
    if (item.key === '__couple') { const parts = [formData.groomName, formData.brideName].filter(Boolean); text = parts.length ? parts.join('  &  ') : ''; }
    else text = formData[item.key];
    if (!text || !String(text).trim()) return acc;
    const value = String(text);
    acc.push({ key: item.key, text: value, size: fieldSizes[styleKey] || item.size, font: fieldFonts[styleKey] || item.font, weight: item.weight, opacity: item.opacity, letterSpacing: item.letterSpacing || 'normal', gap: item.gap, lines: value.split('\n').length });
    return acc;
  }, []);

  // Video text blocks
  const buildVideoTextBlocks = (): VideoTextBlock[] => {
    const blocks = getTextBlocks();
    const heights = blocks.map(b => b.lines * b.size * VIDEO_SCALE * 1.32 + b.gap * VIDEO_SCALE);
    const total = heights.reduce((sum, h) => sum + h, 0);
    const bandCenter = ((textBand.start + textBand.end) / 200) * VIDEO_HEIGHT;
    let y = bandCenter - total / 2;
    return blocks.map((b, i) => { const centerY = y + heights[i] / 2; y += heights[i]; return { ...b, yPx: centerY, fontPx: b.size * VIDEO_SCALE }; });
  };

  // Music preview
  const stopMusicPreview = () => { if (musicCtxRef.current) { try { musicCtxRef.current.close(); } catch { /* */ } musicCtxRef.current = null; } setMusicPlaying(false); };
  const playMusicPreview = async () => {
    if (musicPlaying) { stopMusicPreview(); return; }
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) { toastError('Browser mein music preview support nahi hai'); return; }
      const ctx = new Ctx(); musicCtxRef.current = ctx; await ctx.resume();
      generateBackgroundMusic(ctx, 12, category, null, musicStyle);
      setMusicPlaying(true);
      setTimeout(() => { if (musicCtxRef.current === ctx) stopMusicPreview(); }, 12800);
    } catch { toastError('Music preview start nahi ho paya'); stopMusicPreview(); }
  };
  useEffect(() => () => stopMusicPreview(), []);

  // Download helpers
  const capturePreview = async () => { const html2canvas = (await import('html2canvas')).default; return html2canvas(previewRef.current!, { scale: 2, useCORS: true, backgroundColor: null, logging: false }); };

  const handleDownload = async (type: string) => {
    setGenerating(true);
    try {
      if (type === 'video') {
        const vBlocks = buildVideoTextBlocks();
        const [videoBlob] = await Promise.all([
          generateAnimatedVideo({ templateImage, category, blocks: vBlocks, textColor: textColorValue, textHalo, textOutline, textIsLight, boardStyle: boardStyle || null, textBand, includeAudio, musicStyle, withWatermark: true }),
          capturePreview(),
        ]);
        const vUrl = URL.createObjectURL(videoBlob); const vLink = document.createElement('a');
        vLink.download = `ainos-${template?.slug || 'template'}.webm`; vLink.href = vUrl; vLink.click();
        setTimeout(() => URL.revokeObjectURL(vUrl), 5000);
        toastSuccess('Video + image downloaded!');
      } else if (type === 'pdf') {
        const canvas = await capturePreview(); const image = canvas.toDataURL('image/png');
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
        pdf.addImage(image, 'PNG', 0, 0, canvas.width, canvas.height); pdf.save(`ainos-${template?.slug || 'template'}.pdf`);
        toastSuccess('PDF downloaded!');
      } else {
        const canvas = await capturePreview();
        const image = canvas.toDataURL('image/png'); const link = document.createElement('a');
        link.download = `ainos-${template?.slug || 'template'}.png`; link.href = image; link.click();
        try { const { jsPDF } = await import('jspdf'); const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] }); pdf.addImage(image, 'PNG', 0, 0, canvas.width, canvas.height); pdf.save(`ainos-${template?.slug || 'template'}.pdf`); } catch { /* pdf optional */ }
        toastSuccess('Image + PDF downloaded!');
      }
    } catch (err) { console.error('Download error:', err); toastError('Failed to generate. Please try again.'); }
    finally { setGenerating(false); }
  };

  const handlePreviewDownload = async () => {
    setGenerating(true);
    try { const canvas = await capturePreview(); const image = canvas.toDataURL('image/png'); const link = document.createElement('a'); link.download = `ainos-${template?.slug || 'template'}-preview.png`; link.href = image; link.click(); toastSuccess('Preview downloaded!'); }
    catch { toastError('Failed to generate preview.'); }
    finally { setGenerating(false); }
  };

  const openPayment = (type: string) => {
    const slug = template?.slug || template?.id || '';
    if (isPaidFor(slug, type)) { toastInfo('Already paid — downloading now…'); handleDownload(type); return; }
    const amount = type === 'video' ? (template?.videoPrice || 99) : (template?.price || 49);
    setPaymentModal({ type, amount });
  };

  const handlePay = async () => {
    if (!paymentModal) return; setPaying(true);
    await new Promise(r => setTimeout(r, 1200));
    setPaying(false);
    const { type } = paymentModal; const slug = template?.slug || template?.id || '';
    markPaid(slug, type); setPaymentModal(null);
    toastSuccess('Payment successful! Downloading…');
    await handleDownload(type);
  };

  if (loading) return (<div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900"><div className="text-center"><div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-[#800020] rounded-full animate-spin mx-auto mb-4" /><p className="text-gray-600 dark:text-gray-400">Loading template...</p></div></div>);
  if (!template) return (<div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900"><div className="text-center"><h2 className="text-2xl font-medium text-gray-800 dark:text-gray-200 mb-2">Template not found</h2><Link href="/marketing/invitations" className="text-[#800020] hover:underline">← Back to Gallery</Link></div></div>);

  const fields = getFestivalFields(category).fields;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <ToastBar toasts={toasts} />
      {/* Top Bar */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/60 dark:border-gray-700/60 px-4 py-3 flex items-center justify-between">
        <Link href="/marketing/invitations" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-[#800020] transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /><span className="text-sm">Gallery</span>
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={() => goToTemplate(currentIndex - 1)} className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-[#800020] hover:border-[#800020] transition-all shadow-sm" aria-label="Previous"><ChevronLeft className="w-5 h-5" /></button>
          <span className="text-sm text-gray-600 dark:text-gray-300 tabular-nums font-medium min-w-[3.5rem] text-center">{currentIndex + 1} / {totalTemplates}</span>
          <button onClick={() => goToTemplate(currentIndex + 1)} className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-[#800020] hover:border-[#800020] transition-all shadow-sm" aria-label="Next"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Preview */}
          <div className="lg:w-[380px] xl:w-[420px] flex-shrink-0 mx-auto lg:mx-0">
            <div className="lg:sticky lg:top-24">
              <div id="im-editor-preview" ref={previewRef} className="relative w-full max-h-[55vh] sm:max-h-none mx-auto rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700" style={{ aspectRatio: '9/16' }}>
                <img src={templateImage} alt="Template" className="absolute inset-0 w-full h-full object-cover" />
                {/* Text Overlay */}
                <div className="absolute left-0 right-0 flex items-center justify-center text-center pointer-events-none px-[6%]" style={{ top: `${textBand.start}%`, height: `${textBand.end - textBand.start}%`, color: textColorValue }}>
                  <div className="flex flex-col items-center max-w-full" style={{ ...(boardCss || {}), borderRadius: boardCss ? '18px' : 0, padding: boardCss ? `${Math.round(16 * previewScale)}px ${Math.round(18 * previewScale)}px` : 0 }}>
                    {getTextBlocks().map(b => (
                      <p key={b.key} style={{ fontFamily: `'${b.font}','Tiro Devanagari Hindi',serif`, fontSize: `${b.size * previewScale}px`, fontWeight: b.weight, lineHeight: 1.32, opacity: b.opacity, letterSpacing: b.letterSpacing, marginTop: b.gap ? `${b.gap * previewScale}px` : 0, textShadow: boardCss ? `0 1px 2px ${textHalo}` : `0 0 14px ${textHalo},0 1px 2px rgba(0,0,0,0.12)`, wordBreak: 'break-word' }}>{b.text}</p>
                    ))}
                  </div>
                </div>
                {/* Watermark */}
                {showWatermark && (<><div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: '13%', background: 'linear-gradient(to top,rgba(24,6,12,0.62) 0%,rgba(24,6,12,0.32) 45%,rgba(24,6,12,0) 100%)' }} /><div className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-1.5 pointer-events-none" style={{ paddingBottom: `${Math.round(9 * previewScale)}px` }}><Heart className="w-3 h-3 flex-shrink-0" style={{ color: '#FF6B7A', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }} /><span className="text-white font-semibold tracking-wide text-center" style={{ fontSize: `${Math.max(8.5, Math.round(11 * previewScale))}px`, textShadow: '0 1px 3px rgba(0,0,0,0.85)', lineHeight: 1.3 }}>Made with AINOS<span className="opacity-55 mx-1">·</span><span className="font-medium opacity-90">Invitations</span></span></div></>)}
                {/* Confetti */}
                {!isMuted && (<div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">{Array.from({ length: 18 }).map((_, i) => { const colors = ['#e8a0a8','#f5c9a0','#feca57','#ff9ff3','#48dbfb','#B8860B','#ffffff']; return (<span key={i} className="petal" style={{ left: `${(i*5.7+3)%100}%`, width: `${4+(i%3)*2}px`, height: `${3+(i%2)*2}px`, backgroundColor: colors[i%colors.length], opacity: 0.55+(i%4)*0.1, animationDuration: `${3.5+(i%5)}s`, animationDelay: `${(i*0.35)%5}s`, borderRadius: i%3===0?'50%':'2px' }} />); })}</div>)}
                <button onClick={() => setIsMuted(m => !m)} className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60 transition-all z-10" aria-label="Toggle animation">{isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}</button>
              </div>

              {/* Text position */}
              <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3.5 shadow-sm">
                <div className="flex items-center justify-between mb-2"><p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Text position</p><button type="button" onClick={() => setTextNudge(0)} className="text-[11px] text-[#800020] hover:underline">Auto fit</button></div>
                <input type="range" min={-25} max={25} step={1} value={textNudge} onChange={e => setTextNudge(Number(e.target.value))} className="w-full accent-[#800020]" aria-label="Move text up or down" />
              </div>
              <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3">Clean image ₹{template.price || 49} · Video ₹{template.videoPrice || 99}</p>
            </div>
          </div>

          {/* Right: Form */}
          <div className="flex-1 min-w-0">
            <div className="mb-6"><p className="text-[11px] font-semibold text-[#800020] uppercase tracking-wider mb-1">{fields.length > 0 ? category.charAt(0).toUpperCase() + category.slice(1) : ''}</p><h1 className="text-2xl font-medium text-gray-800 dark:text-gray-100">{template.name}</h1></div>
            <div className="mb-5 flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400"><span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[#800020] flex-shrink-0" /><p>Sample text hai — neeche fields mein apna naam aur date daal kar customize karein.</p></div>

            <div className="space-y-1">
              {fields.map(field => (<FieldEditor key={field.key} label={field.label} value={formData[field.key] || ''} onChange={(val) => handleFieldChange(field.key, val)} maxLength={field.maxLength} config={{ font: fieldFonts[field.key] || 'Playfair Display', size: fieldSizes[field.key] || baseSizeFor(field.key), baseSize: baseSizeFor(field.key), onFontChange: (font) => handleFontChange(field.key, font), onSizeChange: (size) => handleSizeChange(field.key, size) }} />))}
            </div>

            <div className="mt-4 mb-4"><button onClick={() => { const s = SAMPLE_TEXT[category]?.[language] || getDefaultSample(category, language); setFormData(s); }} className="text-sm text-[#800020] hover:underline font-normal">↺ Reset to sample text ({language === 'english' ? 'English' : language === 'hindi' ? 'हिंदी' : 'मराठी'})</button></div>

            {/* Design Studio */}
            <div className="mt-6 mb-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm space-y-5">
              {/* Typography presets */}
              <div>
                <div className="flex items-center justify-between mb-2"><p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Text style</p><span className="text-[10px] text-gray-400">sab lines ek saath</span></div>
                <div className="flex flex-wrap gap-2">{TEXT_STYLES.map(s => (<button key={s.id} type="button" onClick={() => applyTextStyle(s.id)} className={`px-3 py-1.5 rounded-full border text-xs transition-all ${textStyleId === s.id ? 'border-[#800020] bg-[#800020] text-white shadow-sm' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300'}`} style={{ fontFamily: `'${s.fonts.eventName}',serif` }}>{s.name}</button>))}</div>
              </div>
              {/* Backdrop panel */}
              <div>
                <div className="flex items-center justify-between mb-2"><p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Text background</p><span className="text-[10px] text-gray-400">clear text, har artwork</span></div>
                <div className="grid grid-cols-4 gap-2">{BOARD_CHOICES.map(b => { const chosen = b.id === 'auto' ? textBoardId === null : textBoardId === b.id; return (<button key={b.id} type="button" onClick={() => setTextBoardId(b.id === 'auto' ? null : b.id)} className={`rounded-xl border p-2 text-left transition-all ${chosen ? 'border-[#800020] ring-1 ring-[#800020] bg-[#fdf8f0] dark:bg-gray-700' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}`}><span className="block h-6 rounded-md mb-1.5 border border-black/5" style={{ background: b.swatch }} /><span className={`text-[10px] block truncate ${chosen ? 'text-[#800020] font-medium' : 'text-gray-500 dark:text-gray-400'}`}>{b.name}</span></button>); })}</div>
              </div>
              {/* Text colour */}
              <div>
                <div className="flex items-center justify-between mb-2"><p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Text ka rang · {Object.keys(colourPool).length} options</p><button type="button" onClick={() => { setUserTextColor(null); setCustomTextColor(null); }} className={`text-[11px] px-2 py-0.5 rounded-full border transition-all ${!userTextColor && !customTextColor ? 'border-[#800020] text-[#800020] bg-[#800020]/5 font-medium' : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-300'}`}>Auto</button></div>
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">{COLOR_GROUPS.map(group => { const keys = group.keys.filter(k => colourPool[k]); if (!keys.length) return null; return (<div key={group.label}><p className="text-[9px] uppercase tracking-wider text-gray-400 mb-1">{group.label}</p><div className="flex flex-wrap gap-1.5">{keys.map(key => (<button key={key} type="button" title={TEXT_COLORS[key].name} onClick={() => { setUserTextColor(key); setCustomTextColor(null); }} className={`h-6 w-6 rounded-full transition-all hover:scale-110 ${activeTextColor === key && !customTextColor ? 'ring-2 ring-offset-1 ring-[#800020]' : 'ring-1 ring-black/10'}`} style={{ backgroundColor: TEXT_COLORS[key].dotColor }} />))}</div></div>); })}</div>
                <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-700"><label className="relative h-7 w-7 rounded-full ring-1 ring-gray-200 dark:ring-gray-600 overflow-hidden cursor-pointer flex-shrink-0"><input type="color" value={customTextColor || TEXT_COLORS[autoColorKey].color} onChange={e => { setCustomTextColor(e.target.value); setUserTextColor(null); }} className="absolute inset-0 opacity-0 cursor-pointer" aria-label="Custom text colour" /><span className="block h-full w-full" style={{ background: 'conic-gradient(#f66,#fc6,#6c6,#6cc,#66c,#c6c,#f66)' }} /></label><span className="text-[11px] text-gray-500 dark:text-gray-400">{customTextColor ? `Custom ${customTextColor.toUpperCase()}` : 'Koi bhi custom rang chunein'}</span></div>
              </div>
              {/* Music */}
              <div>
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Video music</p>
                <div className="flex flex-wrap gap-2 mb-2.5">{MUSIC_STYLES.map(m => (<button key={m.id} type="button" onClick={() => setMusicStyle(m.id)} className={`px-3 py-1.5 rounded-full border text-xs transition-all ${musicStyle === m.id ? 'border-[#800020] bg-[#800020] text-white shadow-sm' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300'}`}>{m.name}</button>))}<button type="button" onClick={playMusicPreview} className="px-3 py-1.5 rounded-full border border-[#B8860B] text-[#B8860B] hover:bg-[#B8860B]/5 text-xs transition-all flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5" />{musicPlaying ? 'Ruk jaao' : 'Music suno'}</button></div>
                <label className="flex items-start gap-3 cursor-pointer"><div className="relative mt-0.5"><input type="checkbox" checked={includeAudio} onChange={e => setIncludeAudio(e.target.checked)} className="sr-only peer" /><div className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 peer-checked:border-[#800020] peer-checked:bg-[#800020] transition-all flex items-center justify-center">{includeAudio && <Check className="w-3.5 h-3.5 text-white" />}</div></div><div><p className="text-sm font-medium text-gray-800 dark:text-gray-200">Include background music</p><p className="text-xs text-gray-500 dark:text-gray-400">Video ke saath live music track record hota hai</p></div></label>
              </div>
            </div>

            {/* Language */}
            <div className="mt-6 mb-6"><p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Bhasha Chunein / Select Language</p><div className="flex flex-wrap gap-2">{['english','hindi','marathi'].map(lang => (<button key={lang} onClick={() => setLanguage(lang)} className={`px-5 py-2 rounded-full border-2 transition-all text-sm font-normal ${language === lang ? 'border-[#800020] bg-[#800020] text-white shadow-sm' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300'}`}>{lang === 'english' ? 'English' : lang === 'hindi' ? 'हिंदी' : 'मराठी'}</button>))}</div></div>

            {/* Download Section */}
            <div className="border-t border-gray-100 dark:border-gray-700 pt-8 mt-8">
              <h2 className="text-2xl font-bold text-center mb-1 text-[#800020]">Aapka invite taiyaar hai</h2>
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">Ab download karein —</p>
              <button onClick={handlePreviewDownload} disabled={generating} className="w-full mb-5 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"><Download className="w-4 h-4 text-gray-500" /><span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Download Preview (with watermark)</span></button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col"><button onClick={() => openPayment('image')} disabled={generating} className="w-full flex items-center justify-center px-6 py-4 rounded-2xl border-2 border-[#800020] bg-white dark:bg-gray-800 text-[#800020] hover:bg-[#800020] hover:text-white transition-all disabled:opacity-50 font-semibold"><span className="text-base">Image + PDF — ₹{template.price || 49}</span></button><p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">PNG + PDF without mark · instant</p></div>
                <div className="flex flex-col"><button onClick={() => openPayment('video')} disabled={generating} className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[#800020] hover:bg-[#6a0018] text-white transition-all disabled:opacity-50 shadow-lg font-semibold"><Video className="w-5 h-5" /><span className="text-base">Video + Image — ₹{template.videoPrice || 99}</span></button><p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">Video with Indian music + both files</p></div>
              </div>
              {isPaidFor(template.slug || template.id, 'image') && (<button onClick={() => handleDownload('pdf')} disabled={generating} className="w-full mt-4 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#B8860B]/10 text-[#B8860B] hover:bg-[#B8860B]/20 transition-all text-sm font-semibold disabled:opacity-50"><Download className="w-4 h-4" />Download PDF only</button>)}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => !paying && setPaymentModal(null)}><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between mb-4"><h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Complete Payment</h3><button onClick={() => setPaymentModal(null)} disabled={paying} className="text-gray-400 hover:text-gray-600" aria-label="Close"><X className="w-5 h-5" /></button></div><div className="rounded-xl bg-[#fdf8f0] dark:bg-gray-700 border border-gray-100 dark:border-gray-600 p-4 mb-4"><div className="flex justify-between text-sm mb-1"><span className="text-gray-600 dark:text-gray-300">{paymentModal.type === 'video' ? 'Video + Image bundle' : 'Clean image + PDF'}</span><span className="font-medium text-gray-800 dark:text-gray-200">₹{paymentModal.amount}</span></div><div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-300">Template</span><span className="text-gray-800 dark:text-gray-200">{template.name}</span></div></div><p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Payment ke baad download turant shuru ho jayega. (Demo gateway — no real charge)</p><button onClick={handlePay} disabled={paying} className="w-full py-3 rounded-2xl bg-[#800020] hover:bg-[#6a0018] text-white font-medium transition-all disabled:opacity-60 flex items-center justify-center gap-2">{paying ? (<><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Processing…</>) : (<>Pay ₹{paymentModal.amount} & Download</>)}</button></div></div>)}
    </div>
  );
}
