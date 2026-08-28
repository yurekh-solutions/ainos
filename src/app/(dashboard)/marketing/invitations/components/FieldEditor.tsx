'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const GOOGLE_FONTS = [
  'Cormorant Garamond', 'Cormorant SC', 'Playfair Display', 'Cinzel', 'Marcellus',
  'Italiana', 'EB Garamond', 'Great Vibes', 'Pinyon Script', 'Tangerine',
  'Rozha One', 'Yatra One', 'Kalam', 'Tiro Devanagari Hindi', 'Mukta',
  'Hind', 'Poppins', 'Lora', 'Baloo 2', 'Fredoka',
];

const SIZE_STEPS = [
  { key: 'S', mult: 0.85 },
  { key: 'M', mult: 1 },
  { key: 'L', mult: 1.25 },
];

const sizeFromStep = (step: number, base: number) => Math.round(base * SIZE_STEPS[step].mult * 10) / 10;
const stepFromSize = (size: number, base: number) => {
  if (!size) return 1;
  let best = 1;
  let bestDiff = Infinity;
  SIZE_STEPS.forEach((s, i) => {
    const diff = Math.abs(sizeFromStep(i, base) - size);
    if (diff < bestDiff) { bestDiff = diff; best = i; }
  });
  return best;
};

interface FieldConfig {
  font?: string;
  baseSize?: number;
  size?: number;
  onFontChange?: (font: string) => void;
  onSizeChange?: (size: number) => void;
}

interface FieldEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  config?: FieldConfig;
}

const FieldEditor = ({ label, value, onChange, maxLength = 60, config = {} }: FieldEditorProps) => {
  const [showFonts, setShowFonts] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentFont = config.font || 'Playfair Display';
  const baseSize = config.baseSize || 16;
  const displaySize = config.size !== undefined ? config.size : baseSize;
  const sizeStep = stepFromSize(config.size !== undefined ? config.size : baseSize, baseSize);

  const handleSizeStep = (newStep: number) => {
    if (config.onSizeChange) {
      config.onSizeChange(sizeFromStep(newStep, baseSize));
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowFonts(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowFonts(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const filteredFonts = search.trim()
    ? GOOGLE_FONTS.filter((f) => f.toLowerCase().includes(search.trim().toLowerCase()))
    : GOOGLE_FONTS;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {label}
        </label>
        <span className="text-[10px] text-gray-400 tabular-nums">
          {String(value || '').length}/{maxLength}
        </span>
      </div>
      <div className="relative flex items-start gap-2">
        <textarea
          className="flex-1 w-full px-3.5 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 resize-none shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-[#800020]/10 focus:border-[#800020]/40 transition-all
                     placeholder-gray-300 text-gray-800 dark:text-gray-200"
          style={{ fontFamily: `'${currentFont}', 'Tiro Devanagari Hindi', serif`, fontSize: `${displaySize}px` }}
          rows={maxLength > 100 ? 3 : 2}
          maxLength={maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label}
        />
        <div className="relative flex flex-col gap-1.5" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowFonts(!showFonts)}
            className={`flex-shrink-0 w-10 h-10 rounded-xl border flex flex-col items-center justify-center gap-0.5
                       transition-all shadow-sm ${
                         showFonts
                           ? 'border-[#800020] bg-[#800020]/5 text-[#800020]'
                           : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-[#800020] hover:border-[#800020]/30 hover:bg-gray-50'
                       }`}
            title="Font & size"
            aria-expanded={showFonts}
          >
            <span className="text-[10px] font-semibold leading-none tracking-wide">{SIZE_STEPS[sizeStep].key}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showFonts ? 'rotate-180' : ''}`} />
          </button>

          {showFonts && (
            <div className="absolute top-full right-0 mt-2 w-64 sm:w-72 max-h-[22rem] overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-600 z-50 flex flex-col">
              {/* Header: size + search */}
              <div className="sticky top-0 bg-gray-50/95 dark:bg-gray-700/95 backdrop-blur px-4 py-3 border-b border-gray-100 dark:border-gray-600 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">Size</span>
                  <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-0.5 shadow-sm">
                    {SIZE_STEPS.map((s, i) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => handleSizeStep(i)}
                        title={`${sizeFromStep(i, baseSize)}px`}
                        className={`w-7 h-6 text-[11px] font-bold rounded-md transition-all ${
                          sizeStep === i
                            ? 'bg-[#800020] text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {s.key}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search font…"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#800020]/10 focus:border-[#800020]/40"
                />
              </div>

              {/* Font list */}
              <div className="overflow-y-auto p-1.5">
                <p className="px-2.5 pt-1 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Font
                </p>
                {filteredFonts.map((font) => {
                  const selected = currentFont === font;
                  return (
                    <button
                      key={font}
                      type="button"
                      onClick={() => {
                        if (config.onFontChange) config.onFontChange(font);
                      }}
                      className={`w-full flex items-center justify-between text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                        selected
                          ? 'bg-[#800020]/5 text-[#800020] dark:text-[#e8a0b0]'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      style={{ fontFamily: `'${font}', 'Tiro Devanagari Hindi', serif` }}
                    >
                      <span className="truncate pr-2">{font}</span>
                      {selected && <Check className="w-4 h-4 flex-shrink-0" />}
                    </button>
                  );
                })}
                {filteredFonts.length === 0 && (
                  <p className="px-3 py-4 text-xs text-gray-400 text-center">No fonts found</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FieldEditor;
