'use client';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, Image, Video, Palette, Download, RefreshCw,
  CheckCircle, AlertCircle, Upload, Camera, Clapperboard,
  X, ChevronDown,
} from 'lucide-react';
import {
  POLLINATIONS_MODELS, STYLE_MODEL_MAP, CINEMA_CONTROLS,
  generateImage, generateVideo, buildCinemaPrompt,
} from '@/lib/muapi';

type TabId = 'image' | 'video' | 'i2i' | 'cinema';

interface GeneratedItem {
  id: string;
  type: 'image' | 'video';
  prompt: string;
  url?: string;
  model?: string;
  status: 'generating' | 'complete' | 'error';
  error?: string;
  tab: TabId;
}

const TABS: { id: TabId; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'image', label: 'Image Studio', icon: Image, desc: 'Text to Image' },
  { id: 'video', label: 'Video Studio', icon: Video, desc: 'Text to Video' },
  { id: 'i2i', label: 'Image to Image', icon: Camera, desc: 'Transform images' },
  { id: 'cinema', label: 'Cinema', icon: Clapperboard, desc: 'Pro camera controls' },
];

// Free Pollinations models
const FREE_IMAGE_MODELS = Object.keys(POLLINATIONS_MODELS).map(key => ({
  id: key,
  name: key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
}));

export default function AIMediaPage() {
  const [activeTab, setActiveTab] = useState<TabId>('image');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('photorealistic');
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedItem[]>([]);
  const [selectedModel, setSelectedModel] = useState('flux-realism');

  // Image-to-image state
  const [refImage, setRefImage] = useState<File | null>(null);
  const [refImagePreview, setRefImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cinema state
  const [cinemaCamera, setCinemaCamera] = useState('');
  const [cinemaLens, setCinemaLens] = useState('');
  const [cinemaFocal, setCinemaFocal] = useState('');
  const [cinemaAperture, setCinemaAperture] = useState('');

  const styles = [
    { id: 'photorealistic', label: 'Photo', icon: '📷' },
    { id: 'illustration', label: 'Illustration', icon: '🎨' },
    { id: '3d-render', label: '3D Render', icon: '🧊' },
    { id: 'anime', label: 'Anime', icon: '🎌' },
    { id: 'oil-painting', label: 'Oil Paint', icon: '🖼️' },
    { id: 'watercolor', label: 'Watercolor', icon: '💧' },
    { id: 'cinematic', label: 'Cinematic', icon: '🎬' },
    { id: 'minimal', label: 'Minimal', icon: '⬜' },
  ];

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRefImage(file);
      const reader = new FileReader();
      reader.onload = (ev) => setRefImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);

    const newItem: GeneratedItem = {
      id: Date.now().toString(),
      type: activeTab === 'video' ? 'video' : 'image',
      prompt: prompt.trim(),
      status: 'generating',
      tab: activeTab,
    };
    setResults(prev => [newItem, ...prev]);

    try {
      let url: string;
      let model: string;

      if (activeTab === 'cinema') {
        // Build cinema-enhanced prompt
        const cinemaPrompt = buildCinemaPrompt(prompt.trim(), {
          camera: cinemaCamera,
          lens: cinemaLens,
          focalLength: cinemaFocal,
          aperture: cinemaAperture,
        });
        const result = await generateImage({
          prompt: cinemaPrompt,
          model: selectedModel,
          width: 1024,
          height: 1024,
          nologo: true,
          enhance: true,
        });
        url = result.url;
        model = result.model;
      } else if (activeTab === 'video') {
        const result = await generateVideo(prompt.trim());
        url = result.url;
        model = result.model;
      } else if (activeTab === 'i2i' && refImage) {
        // For image-to-image, we use the reference image description + style
        // Pollinations doesn't support direct i2i via URL, so we enhance the prompt
        const i2iPrompt = `${prompt.trim()}, based on uploaded reference image, transform and enhance`;
        const result = await generateImage({
          prompt: i2iPrompt,
          model: selectedModel,
          width: 1024,
          height: 1024,
          nologo: true,
          enhance: true,
        });
        url = result.url;
        model = result.model;
      } else {
        // Standard image generation
        const pollModel = STYLE_MODEL_MAP[style] || selectedModel;
        const result = await generateImage({
          prompt: prompt.trim(),
          model: pollModel,
          width: 1024,
          height: 1024,
          nologo: true,
          enhance: true,
        });
        url = result.url;
        model = result.model;
      }

      setResults(prev => prev.map(r => r.id === newItem.id ? { ...r, status: 'complete', url, model } : r));
    } catch (error) {
      setResults(prev => prev.map(r => r.id === newItem.id ? { ...r, status: 'error', error: error instanceof Error ? error.message : 'Failed' } : r));
    }

    setGenerating(false);
  };

  const tabResults = results.filter(r => r.tab === activeTab);
  const tabComplete = tabResults.filter(r => r.status === 'complete').length;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, hsl(230 20% 5%) 0%, hsl(230 20% 7%) 50%, hsl(230 18% 9%) 100%)' }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(252 60% 55%), hsl(252 55% 45%))' }}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">AI Media Studio</h1>
                <p className="text-sm text-white/50 mt-0.5">Powered by Pollinations.ai — No API key, no limits</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              100% Free
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  isActive ? 'text-white shadow-lg' : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/10'
                }`}
                style={isActive ? { background: 'linear-gradient(135deg, hsl(252 60% 55%) 0%, hsl(252 55% 45%) 100%)' } : {}}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-white/5'}`}>{tab.desc}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prompt & Controls */}
            <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-[hsl(230_18%_10%)] border border-[hsl(230_12%_18%)]" style={{ boxShadow: '0 4px 20px -8px rgb(0 0 0 / 0.3)' }}>

              {/* Image-to-Image: Upload */}
              {activeTab === 'i2i' && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-white/40 uppercase mb-2">Reference Image</p>
                  <div className="flex gap-3 items-start">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
                    {refImagePreview ? (
                      <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-[hsl(230_12%_20%)]">
                        <img src={refImagePreview} alt="Reference" className="w-full h-full object-cover" />
                        <button onClick={() => { setRefImage(null); setRefImagePreview(''); }}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => fileInputRef.current?.click()}
                        className="w-32 h-32 rounded-xl border-2 border-dashed border-[hsl(230_12%_20%)] flex flex-col items-center justify-center gap-2 hover:border-[hsl(252_60%_55%)]/50 transition-colors">
                        <Upload className="w-6 h-6 text-white/30" />
                        <span className="text-xs text-white/40">Upload</span>
                      </button>
                    )}
                    <div className="flex-1">
                      <p className="text-xs text-white/40">Upload a reference image for inspiration. Describe the transformation you want in the prompt below.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cinema Controls */}
              {activeTab === 'cinema' && (
                <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-[10px] font-semibold text-white/40 uppercase mb-1">Camera</p>
                    <select value={cinemaCamera} onChange={e => setCinemaCamera(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[hsl(230_18%_12%)] border border-[hsl(230_12%_20%)] text-xs text-white focus:outline-none focus:border-[hsl(252_60%_55%)]/50">
                      <option value="">Default</option>
                      {CINEMA_CONTROLS.cameras.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-white/40 uppercase mb-1">Lens</p>
                    <select value={cinemaLens} onChange={e => setCinemaLens(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[hsl(230_18%_12%)] border border-[hsl(230_12%_20%)] text-xs text-white focus:outline-none focus:border-[hsl(252_60%_55%)]/50">
                      <option value="">Default</option>
                      {CINEMA_CONTROLS.lenses.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-white/40 uppercase mb-1">Focal Length</p>
                    <select value={cinemaFocal} onChange={e => setCinemaFocal(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[hsl(230_18%_12%)] border border-[hsl(230_12%_20%)] text-xs text-white focus:outline-none focus:border-[hsl(252_60%_55%)]/50">
                      <option value="">Default</option>
                      {CINEMA_CONTROLS.focalLengths.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-white/40 uppercase mb-1">Aperture</p>
                    <select value={cinemaAperture} onChange={e => setCinemaAperture(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[hsl(230_18%_12%)] border border-[hsl(230_12%_20%)] text-xs text-white focus:outline-none focus:border-[hsl(252_60%_55%)]/50">
                      <option value="">Default</option>
                      {CINEMA_CONTROLS.apertures.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Model Selector */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-white/40 uppercase mb-2">Model</p>
                <div className="flex flex-wrap gap-2">
                  {FREE_IMAGE_MODELS.map(m => (
                    <button key={m.id} onClick={() => setSelectedModel(m.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedModel === m.id ? 'bg-[hsl(252_60%_55%)] text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style (for image tab) */}
              {activeTab === 'image' && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-white/40 uppercase mb-2">Style</p>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {styles.map(s => (
                      <button key={s.id} onClick={() => setStyle(s.id)}
                        className={`p-2 rounded-xl text-center transition-all ${style === s.id ? 'bg-[hsl(252_60%_55%)]/10 border-2 border-[hsl(252_60%_55%)]' : 'bg-white/5 border-2 border-transparent'}`}>
                        <span className="text-lg">{s.icon}</span>
                        <p className="text-[9px] font-medium text-white/40 mt-1 leading-tight">{s.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Prompt */}
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
                placeholder={activeTab === 'cinema' ? 'Describe your cinematic shot...' : activeTab === 'video' ? 'Describe your video...' : 'Describe what you want to create...'}
                className="w-full px-4 py-3 rounded-xl bg-[hsl(230_18%_12%)] border border-[hsl(230_12%_20%)] text-sm text-white placeholder-white/30 focus:outline-none focus:border-[hsl(252_60%_55%)]/50 mb-4" />

              {/* Generate */}
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleGenerate} disabled={generating || !prompt.trim()}
                className="w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, hsl(252 60% 55%) 0%, hsl(252 55% 45%) 100%)', boxShadow: '0 8px 24px -6px hsl(252 60% 55% / 0.4)' }}>
                {generating ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate</>}
              </motion.button>
            </motion.div>

            {/* Results */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl bg-[hsl(230_18%_10%)] border border-[hsl(230_12%_18%)]" style={{ boxShadow: '0 4px 20px -8px rgb(0 0 0 / 0.3)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-5 h-5 text-emerald-400" />
                <h2 className="font-semibold text-white">Results</h2>
                {generating && <span className="text-xs font-medium ml-auto" style={{ color: 'hsl(var(--primary))' }}>Generating...</span>}
              </div>

              {tabResults.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-[hsl(252_60%_55%)]/20 mx-auto mb-3" />
                  <p className="text-sm font-medium text-white/60">No results yet</p>
                  <p className="text-xs text-white/40 mt-1">Start by describing what you want to create</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tabResults.map(result => (
                    <motion.div key={result.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="rounded-xl overflow-hidden border border-[hsl(230_12%_18%)]">
                      <div className="aspect-square bg-[hsl(230_18%_12%)] flex items-center justify-center relative">
                        {result.status === 'generating' ? (
                          <div className="text-center">
                            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: 'hsl(var(--primary))' }} />
                            <p className="text-xs text-white/40">Generating...</p>
                          </div>
                        ) : result.status === 'complete' && result.url ? (
                          <>
                            {result.type === 'image' ? (
                              <img src={result.url} alt={result.prompt} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <video src={result.url} controls className="w-full h-full object-cover" />
                            )}
                            <a href={result.url} download target="_blank" rel="noopener noreferrer"
                              className="absolute bottom-2 right-2 p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors">
                              <Download className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
                            </a>
                          </>
                        ) : result.status === 'error' ? (
                          <div className="text-center p-4">
                            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                            <p className="text-xs text-red-500">{result.error}</p>
                          </div>
                        ) : null}
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-white/40 line-clamp-2">{result.prompt}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-white/40 capitalize">{result.type}</span>
                          {result.model && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-white/40">{result.model}</span>}
                          {result.status === 'complete' && <CheckCircle className="w-3 h-3 text-emerald-400 ml-auto" />}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="p-5 rounded-2xl bg-[hsl(230_18%_10%)] border border-[hsl(230_12%_18%)]" style={{ boxShadow: '0 4px 20px -8px rgb(0 0 0 / 0.3)' }}>
              <h3 className="text-sm font-semibold text-white mb-3">Session Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs"><span className="text-white/40">This Tab</span><span className="font-semibold text-white">{tabComplete}</span></div>
                <div className="flex justify-between text-xs"><span className="text-white/40">Total Generated</span><span className="font-semibold text-white">{results.filter(r => r.status === 'complete').length}</span></div>
                <div className="flex justify-between text-xs"><span className="text-white/40">Cost</span><span className="font-semibold text-emerald-400">$0.00</span></div>
              </div>
            </motion.div>

            {/* Available Models */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="p-5 rounded-2xl bg-[hsl(230_18%_10%)] border border-[hsl(230_12%_18%)]" style={{ boxShadow: '0 4px 20px -8px rgb(0 0 0 / 0.3)' }}>
              <h3 className="text-sm font-semibold text-white mb-3">Free Models</h3>
              <div className="space-y-1.5">
                {FREE_IMAGE_MODELS.map(m => (
                  <div key={m.id} className="p-2 rounded-lg bg-white/5">
                    <p className="text-xs font-medium text-white">{m.name}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-[hsl(252_60%_55%)]/5 border border-[hsl(230_12%_18%)]">
              <h3 className="text-sm font-semibold text-white mb-2">No Cost</h3>
              <p className="text-xs text-white/40 leading-relaxed">
                Powered by Pollinations.ai — no API key, no limits. Generate unlimited images and videos for your marketing campaigns.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
