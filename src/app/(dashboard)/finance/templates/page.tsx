'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Palette, Type, Layout, FileText, Save, Check, Trash2, Copy,
  Eye, ChevronDown, ChevronUp, Star, Plus
} from 'lucide-react';

interface Template {
  id?: string;
  name: string;
  isDefault: boolean;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  fontSize: string;
  layout: string;
  showLogo: boolean;
  logoSize: string;
  logoPosition: string;
  showQrCode: boolean;
  showBankDetails: boolean;
  showTerms: boolean;
  terms: string;
  notes: string;
  headerText: string;
  footerText: string;
  accentWidth: string;
  borderRadius: string;
}

const defaultTemplate: Template = {
  name: 'My Template',
  isDefault: true,
  primaryColor: '#6D28D9',
  secondaryColor: '#8B5CF6',
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937',
  fontFamily: 'Helvetica',
  fontSize: 'medium',
  layout: 'standard',
  showLogo: true,
  logoSize: 'medium',
  logoPosition: 'left',
  showQrCode: false,
  showBankDetails: true,
  showTerms: true,
  terms: 'Payment due within 30 days. Late payments may attract interest charges.',
  notes: 'Thank you for your business!',
  headerText: '',
  footerText: 'Powered by AINOS',
  accentWidth: 'thin',
  borderRadius: 'medium',
};

const PRESETS: Record<string, Partial<Template>> = {
  Standard: {
    primaryColor: '#6D28D9', secondaryColor: '#8B5CF6', backgroundColor: '#FFFFFF',
    textColor: '#1F2937', layout: 'standard', fontSize: 'medium', borderRadius: 'medium',
  },
  Modern: {
    primaryColor: '#2563EB', secondaryColor: '#3B82F6', backgroundColor: '#F8FAFC',
    textColor: '#0F172A', layout: 'modern', fontSize: 'medium', borderRadius: 'large',
  },
  Compact: {
    primaryColor: '#059669', secondaryColor: '#10B981', backgroundColor: '#FFFFFF',
    textColor: '#374151', layout: 'compact', fontSize: 'small', borderRadius: 'small',
  },
  Minimal: {
    primaryColor: '#1F2937', secondaryColor: '#6B7280', backgroundColor: '#FFFFFF',
    textColor: '#111827', layout: 'minimal', fontSize: 'small', borderRadius: 'small',
  },
  Bold: {
    primaryColor: '#DC2626', secondaryColor: '#F87171', backgroundColor: '#FFFFFF',
    textColor: '#1F2937', layout: 'standard', fontSize: 'large', borderRadius: 'medium',
  },
  Elegant: {
    primaryColor: '#7C3AED', secondaryColor: '#A78BFA', backgroundColor: '#FAFAF9',
    textColor: '#292524', layout: 'modern', fontSize: 'medium', borderRadius: 'large',
  },
  Corporate: {
    primaryColor: '#1E3A5F', secondaryColor: '#2D5A8E', backgroundColor: '#FFFFFF',
    textColor: '#1A1A2E', layout: 'standard', fontSize: 'medium', borderRadius: 'small',
  },
  Ocean: {
    primaryColor: '#0EA5E9', secondaryColor: '#38BDF8', backgroundColor: '#F0F9FF',
    textColor: '#0C4A6E', layout: 'modern', fontSize: 'medium', borderRadius: 'large',
  },
  Sunset: {
    primaryColor: '#EA580C', secondaryColor: '#FB923C', backgroundColor: '#FFF7ED',
    textColor: '#431407', layout: 'standard', fontSize: 'medium', borderRadius: 'medium',
  },
  Forest: {
    primaryColor: '#15803D', secondaryColor: '#4ADE80', backgroundColor: '#F0FDF4',
    textColor: '#14532D', layout: 'modern', fontSize: 'medium', borderRadius: 'medium',
  },
  Rose: {
    primaryColor: '#E11D48', secondaryColor: '#FB7185', backgroundColor: '#FFF1F2',
    textColor: '#4C0519', layout: 'modern', fontSize: 'medium', borderRadius: 'large',
  },
  Royal: {
    primaryColor: '#4F46E5', secondaryColor: '#818CF8', backgroundColor: '#EEF2FF',
    textColor: '#1E1B4B', layout: 'standard', fontSize: 'medium', borderRadius: 'medium',
  },
  Teal: {
    primaryColor: '#0D9488', secondaryColor: '#2DD4BF', backgroundColor: '#F0FDFA',
    textColor: '#134E4A', layout: 'modern', fontSize: 'medium', borderRadius: 'large',
  },
  Amber: {
    primaryColor: '#D97706', secondaryColor: '#FBBF24', backgroundColor: '#FFFBEB',
    textColor: '#451A03', layout: 'standard', fontSize: 'medium', borderRadius: 'medium',
  },
  Slate: {
    primaryColor: '#475569', secondaryColor: '#94A3B8', backgroundColor: '#F8FAFC',
    textColor: '#0F172A', layout: 'minimal', fontSize: 'small', borderRadius: 'small',
  },
  Midnight: {
    primaryColor: '#0F172A', secondaryColor: '#334155', backgroundColor: '#FFFFFF',
    textColor: '#1E293B', layout: 'minimal', fontSize: 'medium', borderRadius: 'none',
  },
  Candy: {
    primaryColor: '#DB2777', secondaryColor: '#F472B6', backgroundColor: '#FDF2F8',
    textColor: '#500724', layout: 'modern', fontSize: 'medium', borderRadius: 'large',
  },
  Sky: {
    primaryColor: '#0284C7', secondaryColor: '#7DD3FC', backgroundColor: '#F0F9FF',
    textColor: '#082F49', layout: 'standard', fontSize: 'medium', borderRadius: 'large',
  },
};

// Individual color swatches for quick color picking
const COLOR_SWATCHES: { name: string; primary: string; secondary: string }[] = [
  { name: 'Purple', primary: '#6D28D9', secondary: '#8B5CF6' },
  { name: 'Blue', primary: '#2563EB', secondary: '#3B82F6' },
  { name: 'Indigo', primary: '#4F46E5', secondary: '#818CF8' },
  { name: 'Sky', primary: '#0284C7', secondary: '#7DD3FC' },
  { name: 'Cyan', primary: '#0891B2', secondary: '#22D3EE' },
  { name: 'Teal', primary: '#0D9488', secondary: '#2DD4BF' },
  { name: 'Green', primary: '#15803D', secondary: '#4ADE80' },
  { name: 'Emerald', primary: '#059669', secondary: '#10B981' },
  { name: 'Lime', primary: '#65A30D', secondary: '#A3E635' },
  { name: 'Yellow', primary: '#CA8A04', secondary: '#FDE047' },
  { name: 'Amber', primary: '#D97706', secondary: '#FBBF24' },
  { name: 'Orange', primary: '#EA580C', secondary: '#FB923C' },
  { name: 'Red', primary: '#DC2626', secondary: '#F87171' },
  { name: 'Rose', primary: '#E11D48', secondary: '#FB7185' },
  { name: 'Pink', primary: '#DB2777', secondary: '#F472B6' },
  { name: 'Fuchsia', primary: '#C026D3', secondary: '#E879F9' },
  { name: 'Navy', primary: '#1E3A5F', secondary: '#2D5A8E' },
  { name: 'Slate', primary: '#475569', secondary: '#94A3B8' },
  { name: 'Dark', primary: '#0F172A', secondary: '#334155' },
  { name: 'Charcoal', primary: '#1F2937', secondary: '#6B7280' },
];

const FONT_OPTIONS = ['Helvetica', 'Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Trebuchet MS'];
const FONT_SIZES = { small: '12px', medium: '14px', large: '16px' };
const BORDER_RADII = { small: '4px', medium: '8px', large: '16px', none: '0px' };
const ACCENT_WIDTHS = { thin: '3px', medium: '5px', thick: '8px', none: '0px' };

export default function TemplateDesignerPage() {
  const [template, setTemplate] = useState<Template>(defaultTemplate);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [saved, setSaved] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('branding');
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/invoice-templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
        if (data.length > 0) {
          const def = data.find((t: Template) => t.isDefault) || data[0];
          setTemplate(def);
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const update = (key: keyof Template, value: string | boolean) => {
    setTemplate(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const applyPreset = (name: string) => {
    const preset = PRESETS[name];
    if (preset) {
      setTemplate(prev => ({ ...prev, ...preset, name: `${name} Template` }));
      setSaved(false);
    }
  };

  const saveTemplate = async () => {
    try {
      const method = template.id ? 'PUT' : 'POST';
      const res = await fetch('/api/invoice-templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      if (res.ok) {
        const saved = await res.json();
        setTemplate(prev => ({ ...prev, id: saved.id }));
        setSaved(true);
        fetchTemplates();
        setTimeout(() => setSaved(false), 2000);
      }
    } catch { /* ignore */ }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      const res = await fetch(`/api/invoice-templates?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTemplate(defaultTemplate);
        fetchTemplates();
      }
    } catch { /* ignore */ }
  };

  const duplicateTemplate = () => {
    const { id, ...copy } = template;
    setTemplate({ ...copy, name: `${template.name} (Copy)`, isDefault: false } as Template);
    setSaved(false);
  };

  const toggleSection = (s: string) => setExpandedSection(prev => prev === s ? null : s);

  const fs = FONT_SIZES[template.fontSize as keyof typeof FONT_SIZES] || '14px';
  const br = BORDER_RADII[template.borderRadius as keyof typeof BORDER_RADII] || '8px';
  const aw = ACCENT_WIDTHS[template.accentWidth as keyof typeof ACCENT_WIDTHS] || '3px';

  const sampleItems = [
    { name: 'Web Development Service', hsn: '998314', qty: 1, rate: 50000, gst: 18 },
    { name: 'SEO Package', hsn: '998313', qty: 1, rate: 25000, gst: 18 },
  ];
  const subtotal = 75000;
  const tax = 13500;
  const total = 88500;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--page-gradient)' }}>
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p style={{ color: 'var(--muted-foreground)' }}>Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-6" style={{ background: 'var(--page-gradient)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Invoice Template Designer</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Customize colors, fonts, layout — make invoices match your brand
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={duplicateTemplate} className="btn-secondary flex items-center gap-2 px-3 py-2 rounded-lg text-sm">
            <Copy size={15} /> Duplicate
          </button>
          <button onClick={saveTemplate} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm">
            {saved ? <><Check size={15} /> Saved!</> : <><Save size={15} /> Save Template</>}
          </button>
        </div>
      </div>

      {/* Preset Templates */}
      <div className="glass-card rounded-xl p-4 mb-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
          <Palette size={16} /> Quick Presets — Click to Apply
        </h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(PRESETS).map(([name, preset]) => (
            <button
              key={name}
              onClick={() => applyPreset(name)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all hover:scale-105"
              style={{
                borderColor: preset.primaryColor,
                background: `${preset.primaryColor}10`,
              }}
            >
              <div className="flex gap-1">
                <div className="w-4 h-4 rounded-full" style={{ background: preset.primaryColor }} />
                <div className="w-4 h-4 rounded-full" style={{ background: preset.secondaryColor }} />
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* LEFT: Controls */}
        <div className="space-y-3">
          {/* Template Name */}
          <div className="glass-card rounded-xl p-4">
            <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--muted-foreground)' }}>Template Name</label>
            <input
              value={template.name}
              onChange={e => update('name', e.target.value)}
              className="glass-input w-full px-3 py-2 rounded-lg text-sm"
              style={{ color: 'var(--foreground)' }}
            />
            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <input type="checkbox" checked={template.isDefault} onChange={e => update('isDefault', e.target.checked)} className="rounded" />
              <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                <Star size={14} className="inline mr-1" /> Set as default template
              </span>
            </label>
          </div>

          {/* Branding Colors */}
          <div className="glass-card rounded-xl overflow-hidden">
            <button onClick={() => toggleSection('branding')} className="w-full flex items-center justify-between p-4">
              <span className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <Palette size={16} /> Branding Colors
              </span>
              {expandedSection === 'branding' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedSection === 'branding' && (
              <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                {[
                  { label: 'Primary Color', key: 'primaryColor' as const },
                  { label: 'Secondary Color', key: 'secondaryColor' as const },
                  { label: 'Background', key: 'backgroundColor' as const },
                  { label: 'Text Color', key: 'textColor' as const },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={template[key]}
                        onChange={e => update(key, e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0"
                      />
                      <input
                        value={template[key]}
                        onChange={e => update(key, e.target.value)}
                        className="glass-input flex-1 px-2 py-1 rounded text-xs font-mono"
                        style={{ color: 'var(--foreground)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Typography */}
          <div className="glass-card rounded-xl overflow-hidden">
            <button onClick={() => toggleSection('typography')} className="w-full flex items-center justify-between p-4">
              <span className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <Type size={16} /> Typography & Size
              </span>
              {expandedSection === 'typography' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedSection === 'typography' && (
              <div className="px-4 pb-4 space-y-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Font Family</label>
                  <select
                    value={template.fontFamily}
                    onChange={e => update('fontFamily', e.target.value)}
                    className="glass-input w-full px-3 py-2 rounded-lg text-sm"
                    style={{ color: 'var(--foreground)', fontFamily: template.fontFamily }}
                  >
                    {FONT_OPTIONS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Font Size</label>
                  <div className="flex gap-2">
                    {Object.entries(FONT_SIZES).map(([key, size]) => (
                      <button
                        key={key}
                        onClick={() => update('fontSize', key)}
                        className="flex-1 py-2 rounded-lg text-sm border transition-all"
                        style={{
                          borderColor: template.fontSize === key ? template.primaryColor : 'var(--border)',
                          background: template.fontSize === key ? `${template.primaryColor}15` : 'transparent',
                          color: 'var(--foreground)',
                          fontWeight: template.fontSize === key ? 600 : 400,
                        }}
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)} ({size})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Layout */}
          <div className="glass-card rounded-xl overflow-hidden">
            <button onClick={() => toggleSection('layout')} className="w-full flex items-center justify-between p-4">
              <span className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <Layout size={16} /> Layout & Style
              </span>
              {expandedSection === 'layout' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedSection === 'layout' && (
              <div className="px-4 pb-4 space-y-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Layout Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['standard', 'modern', 'compact', 'minimal'].map(l => (
                      <button
                        key={l}
                        onClick={() => update('layout', l)}
                        className="py-2 rounded-lg text-sm border transition-all capitalize"
                        style={{
                          borderColor: template.layout === l ? template.primaryColor : 'var(--border)',
                          background: template.layout === l ? `${template.primaryColor}15` : 'transparent',
                          color: 'var(--foreground)',
                          fontWeight: template.layout === l ? 600 : 400,
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Border Radius</label>
                  <div className="flex gap-2">
                    {Object.entries(BORDER_RADII).map(([key, val]) => (
                      <button
                        key={key}
                        onClick={() => update('borderRadius', key)}
                        className="flex-1 py-2 rounded-lg text-xs border capitalize"
                        style={{
                          borderColor: template.borderRadius === key ? template.primaryColor : 'var(--border)',
                          background: template.borderRadius === key ? `${template.primaryColor}15` : 'transparent',
                          color: 'var(--foreground)',
                        }}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Accent Bar Width</label>
                  <div className="flex gap-2">
                    {Object.entries(ACCENT_WIDTHS).map(([key, val]) => (
                      <button
                        key={key}
                        onClick={() => update('accentWidth', key)}
                        className="flex-1 py-2 rounded-lg text-xs border capitalize"
                        style={{
                          borderColor: template.accentWidth === key ? template.primaryColor : 'var(--border)',
                          background: template.accentWidth === key ? `${template.primaryColor}15` : 'transparent',
                          color: 'var(--foreground)',
                        }}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Logo</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={template.showLogo} onChange={e => update('showLogo', e.target.checked)} />
                      <span className="text-sm" style={{ color: 'var(--foreground)' }}>Show Logo</span>
                    </label>
                    {template.showLogo && (
                      <>
                        <select value={template.logoSize} onChange={e => update('logoSize', e.target.value)} className="glass-input px-2 py-1 rounded text-xs">
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                        <select value={template.logoPosition} onChange={e => update('logoPosition', e.target.value)} className="glass-input px-2 py-1 rounded text-xs">
                          <option value="left">Left</option>
                          <option value="right">Right</option>
                          <option value="center">Center</option>
                        </select>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content Toggles */}
          <div className="glass-card rounded-xl overflow-hidden">
            <button onClick={() => toggleSection('content')} className="w-full flex items-center justify-between p-4">
              <span className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <FileText size={16} /> Content Sections
              </span>
              {expandedSection === 'content' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedSection === 'content' && (
              <div className="px-4 pb-4 space-y-3">
                {[
                  { label: 'Show Bank Details', key: 'showBankDetails' as const },
                  { label: 'Show Terms & Conditions', key: 'showTerms' as const },
                  { label: 'Show QR Code', key: 'showQrCode' as const },
                ].map(({ label, key }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={template[key]} onChange={e => update(key, e.target.checked)} />
                    <span className="text-sm" style={{ color: 'var(--foreground)' }}>{label}</span>
                  </label>
                ))}
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Header Text</label>
                  <input value={template.headerText || ''} onChange={e => update('headerText', e.target.value)} placeholder="Optional header text" className="glass-input w-full px-3 py-2 rounded-lg text-sm" style={{ color: 'var(--foreground)' }} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Notes</label>
                  <textarea value={template.notes} onChange={e => update('notes', e.target.value)} rows={2} className="glass-input w-full px-3 py-2 rounded-lg text-sm resize-none" style={{ color: 'var(--foreground)' }} />
                </div>
                {template.showTerms && (
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Terms & Conditions</label>
                    <textarea value={template.terms || ''} onChange={e => update('terms', e.target.value)} rows={2} className="glass-input w-full px-3 py-2 rounded-lg text-sm resize-none" style={{ color: 'var(--foreground)' }} />
                  </div>
                )}
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Footer Text</label>
                  <input value={template.footerText || ''} onChange={e => update('footerText', e.target.value)} placeholder="Footer text" className="glass-input w-full px-3 py-2 rounded-lg text-sm" style={{ color: 'var(--foreground)' }} />
                </div>
              </div>
            )}
          </div>

          {/* Saved Templates List */}
          {templates.length > 0 && (
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <FileText size={16} /> Saved Templates ({templates.length})
              </h3>
              <div className="space-y-2">
                {templates.map(t => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01]"
                    style={{
                      borderColor: t.isDefault ? template.primaryColor : 'var(--border)',
                      background: template.id === t.id ? `${template.primaryColor}08` : 'transparent',
                    }}
                    onClick={() => setTemplate(t)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-full" style={{ background: t.primaryColor }} />
                        <div className="w-3 h-3 rounded-full" style={{ background: t.secondaryColor }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{t.name}</p>
                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{t.layout} · {t.fontFamily}</p>
                      </div>
                      {t.isDefault && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${template.primaryColor}20`, color: template.primaryColor }}>Default</span>}
                    </div>
                    <button onClick={e => { e.stopPropagation(); deleteTemplate(t.id!); }} className="p-1 rounded hover:bg-red-500/10">
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Live Preview */}
        <div className="sticky top-6">
          <div className="glass-card rounded-xl p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
                <Eye size={14} /> LIVE PREVIEW
              </span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full" style={{ background: template.primaryColor }} />
                <div className="w-3 h-3 rounded-full" style={{ background: template.secondaryColor }} />
              </div>
            </div>

            {/* Invoice Preview */}
            <div
              style={{
                background: template.backgroundColor,
                borderRadius: br,
                fontFamily: template.fontFamily,
                fontSize: fs,
                color: template.textColor,
                borderLeft: `${aw} solid ${template.primaryColor}`,
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{ background: `linear-gradient(135deg, ${template.primaryColor}, ${template.secondaryColor})`, padding: template.layout === 'compact' ? '12px 16px' : '20px 24px' }}>
                <div className="flex items-center justify-between">
                  <div>
                    {template.showLogo && (
                      <div
                        style={{
                          width: template.logoSize === 'small' ? 32 : template.logoSize === 'large' ? 56 : 44,
                          height: template.logoSize === 'small' ? 32 : template.logoSize === 'large' ? 56 : 44,
                          background: 'rgba(255,255,255,0.2)',
                          borderRadius: br,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginBottom: 6,
                        }}
                      >
                        <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>LOGO</span>
                      </div>
                    )}
                    <h2 style={{ color: '#fff', fontSize: template.layout === 'compact' ? 14 : 18, fontWeight: 700, margin: 0 }}>
                      Your Company Name
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: fs === '12px' ? 10 : 12, margin: '2px 0 0' }}>
                      GSTIN: 27AABCU9603R1ZM
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h3 style={{ color: '#fff', fontSize: template.layout === 'compact' ? 16 : 22, fontWeight: 800, margin: 0, letterSpacing: 1 }}>
                      INVOICE
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: fs === '12px' ? 10 : 12, margin: '2px 0 0' }}>
                      AIN-0001-2026
                    </p>
                  </div>
                </div>
              </div>

              {/* Bill To */}
              <div style={{ padding: template.layout === 'compact' ? '10px 16px' : '16px 24px' }}>
                <div className="flex justify-between" style={{ marginBottom: template.layout === 'compact' ? 8 : 12 }}>
                  <div>
                    <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: template.primaryColor, fontWeight: 600, margin: '0 0 4px' }}>Bill To</p>
                    <p style={{ fontWeight: 700, fontSize: fs, margin: 0 }}>Rajesh Enterprises</p>
                    <p style={{ fontSize: fs === '12px' ? 10 : 12, opacity: 0.7, margin: '2px 0' }}>GSTIN: 27AABCU9603R1ZM</p>
                    <p style={{ fontSize: fs === '12px' ? 10 : 12, opacity: 0.7, margin: 0 }}>Mumbai, Maharashtra</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: template.primaryColor, fontWeight: 600, margin: '0 0 4px' }}>Details</p>
                    <p style={{ fontSize: fs === '12px' ? 10 : 12, margin: '2px 0' }}>Date: 01/10/2026</p>
                    <p style={{ fontSize: fs === '12px' ? 10 : 12, margin: '2px 0' }}>Due: 31/10/2026</p>
                    <p style={{ fontSize: fs === '12px' ? 10 : 12, margin: '2px 0' }}>Type: Intra-State</p>
                  </div>
                </div>

                {template.headerText && (
                  <div style={{ background: `${template.primaryColor}08`, padding: '8px 12px', borderRadius: br, marginBottom: 10, fontSize: fs === '12px' ? 10 : 12, borderLeft: `2px solid ${template.primaryColor}` }}>
                    {template.headerText}
                  </div>
                )}

                {/* Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
                  <thead>
                    <tr style={{ background: `${template.primaryColor}10` }}>
                      {['Item', 'HSN', 'Qty', 'Rate', 'GST', 'Total'].map(h => (
                        <th key={h} style={{ padding: template.layout === 'compact' ? '6px 8px' : '8px 12px', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: template.primaryColor, fontWeight: 600, textAlign: h === 'Item' || h === 'HSN' ? 'left' : 'right', borderBottom: `2px solid ${template.primaryColor}30` }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sampleItems.map((item, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border, #e5e7eb)' }}>
                        <td style={{ padding: template.layout === 'compact' ? '6px 8px' : '10px 12px', fontWeight: 500 }}>{item.name}</td>
                        <td style={{ padding: template.layout === 'compact' ? '6px 8px' : '10px 12px', fontSize: fs === '12px' ? 10 : 12, opacity: 0.6 }}>{item.hsn}</td>
                        <td style={{ padding: template.layout === 'compact' ? '6px 8px' : '10px 12px', textAlign: 'right' }}>{item.qty}</td>
                        <td style={{ padding: template.layout === 'compact' ? '6px 8px' : '10px 12px', textAlign: 'right' }}>₹{item.rate.toLocaleString('en-IN')}</td>
                        <td style={{ padding: template.layout === 'compact' ? '6px 8px' : '10px 12px', textAlign: 'right' }}>{item.gst}%</td>
                        <td style={{ padding: template.layout === 'compact' ? '6px 8px' : '10px 12px', textAlign: 'right', fontWeight: 600 }}>₹{(item.rate * 1.18).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: '55%' }}>
                    <div className="flex justify-between" style={{ padding: '4px 0', fontSize: fs === '12px' ? 10 : 12 }}>
                      <span style={{ opacity: 0.7 }}>Subtotal</span>
                      <span>₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between" style={{ padding: '4px 0', fontSize: fs === '12px' ? 10 : 12 }}>
                      <span style={{ opacity: 0.7 }}>CGST (9%)</span>
                      <span>₹{(tax / 2).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between" style={{ padding: '4px 0', fontSize: fs === '12px' ? 10 : 12 }}>
                      <span style={{ opacity: 0.7 }}>SGST (9%)</span>
                      <span>₹{(tax / 2).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between" style={{
                      padding: template.layout === 'compact' ? '8px 12px' : '10px 16px',
                      marginTop: 6,
                      background: template.primaryColor,
                      borderRadius: br,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: template.layout === 'compact' ? 14 : 16,
                    }}>
                      <span>Grand Total</span>
                      <span>₹{total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                {template.showBankDetails && (
                  <div style={{ marginTop: 16, padding: '10px 14px', background: `${template.primaryColor}06`, borderRadius: br, border: `1px dashed ${template.primaryColor}30` }}>
                    <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: template.primaryColor, fontWeight: 600, margin: '0 0 6px' }}>Bank Details</p>
                    <div style={{ fontSize: fs === '12px' ? 10 : 12, opacity: 0.7 }}>
                      <p style={{ margin: '2px 0' }}>Bank: HDFC Bank, Mumbai Branch</p>
                      <p style={{ margin: '2px 0' }}>A/C: 1234567890 | IFSC: HDFC0001234</p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {template.notes && (
                  <p style={{ marginTop: 12, fontSize: fs === '12px' ? 10 : 12, opacity: 0.6, fontStyle: 'italic' }}>{template.notes}</p>
                )}

                {/* Terms */}
                {template.showTerms && template.terms && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border, #e5e7eb)' }}>
                    <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: template.primaryColor, fontWeight: 600, margin: '0 0 4px' }}>Terms & Conditions</p>
                    <p style={{ fontSize: fs === '12px' ? 9 : 11, opacity: 0.6, margin: 0 }}>{template.terms}</p>
                  </div>
                )}

                {/* Footer */}
                {template.footerText && (
                  <div style={{ marginTop: 12, textAlign: 'center', padding: '8px 0', borderTop: `2px solid ${template.primaryColor}20` }}>
                    <p style={{ fontSize: 10, opacity: 0.5, margin: 0 }}>{template.footerText}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
