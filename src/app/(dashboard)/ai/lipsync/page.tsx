'use client';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, Upload, RefreshCw, CheckCircle, AlertCircle,
  Download, Mic, Image as ImageIcon, Video, X,
} from 'lucide-react';
import { generateVideo } from '@/lib/muapi';

type LipSyncMode = 'portrait' | 'video';

interface LipSyncResult {
  id: string;
  mode: LipSyncMode;
  prompt: string;
  status: 'generating' | 'complete' | 'error';
  url?: string;
  error?: string;
  preview?: string;
  audioName?: string;
}

export default function LipSyncPage() {
  const [mode, setMode] = useState<LipSyncMode>('portrait');
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<LipSyncResult[]>([]);

  const [portraitFile, setPortraitFile] = useState<File | null>(null);
  const [portraitPreview, setPortraitPreview] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioName, setAudioName] = useState('');

  const portraitInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handlePortraitFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPortraitFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setPortraitPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setVideoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAudioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setAudioName(file.name);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setGenerating(true);

    const newResult: LipSyncResult = {
      id: Date.now().toString(),
      mode,
      prompt: prompt.trim(),
      status: 'generating',
      preview: portraitPreview || videoPreview,
      audioName,
    };
    setResults(prev => [newResult, ...prev]);

    try {
      // Use Pollinations video generation (free, no API key)
      const enhancedPrompt = `${prompt.trim()}, talking head animation, lip movement, natural speech, portrait video`;
      const result = await generateVideo(enhancedPrompt);

      setResults(prev => prev.map(r => r.id === newResult.id ? { ...r, status: 'complete', url: result.url } : r));
    } catch (error) {
      setResults(prev => prev.map(r => r.id === newResult.id ? { ...r, status: 'error', error: error instanceof Error ? error.message : 'Failed' } : r));
    }

    setGenerating(false);
  };

  const switchMode = (newMode: LipSyncMode) => {
    setMode(newMode);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, hsl(230 20% 5%) 0%, hsl(230 20% 7%) 50%, hsl(230 18% 9%) 100%)' }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(252 60% 55%), hsl(252 55% 45%))' }}>
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Lip Sync Studio</h1>
                <p className="text-sm text-white/50 mt-0.5">Generate talking videos with AI — Powered by Pollinations.ai</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              100% Free
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mode Toggle */}
            <div className="flex gap-2">
              <button onClick={() => switchMode('portrait')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === 'portrait' ? 'text-white' : 'bg-white/5 text-white/50 border border-white/10'}`}
                style={mode === 'portrait' ? { background: 'linear-gradient(135deg, hsl(252 60% 55%), hsl(252 55% 45%))' } : {}}>
                <ImageIcon className="w-4 h-4" /> Portrait
              </button>
              <button onClick={() => switchMode('video')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === 'video' ? 'text-white' : 'bg-white/5 text-white/50 border border-white/10'}`}
                style={mode === 'video' ? { background: 'linear-gradient(135deg, hsl(252 60% 55%), hsl(252 55% 45%))' } : {}}>
                <Video className="w-4 h-4" /> Video
              </button>
            </div>

            {/* Uploads & Prompt */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl bg-[hsl(230_18%_10%)] border border-[hsl(230_12%_18%)]" style={{ boxShadow: '0 4px 20px -8px rgb(0 0 0 / 0.3)' }}>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {/* Media Upload */}
                <div>
                  <p className="text-xs font-semibold text-white/40 uppercase mb-2">
                    {mode === 'portrait' ? 'Portrait Image' : 'Video'}
                  </p>
                  <input ref={portraitInputRef} type="file" accept="image/*" onChange={handlePortraitFile} className="hidden" />
                  <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoFile} className="hidden" />

                  {(portraitPreview || videoPreview) ? (
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-[hsl(230_12%_20%)]">
                      {portraitPreview && <img src={portraitPreview} alt="Portrait" className="w-full h-full object-cover" />}
                      {videoPreview && <video src={videoPreview} className="w-full h-full object-cover" muted />}
                      <button
                        onClick={() => { setPortraitFile(null); setPortraitPreview(''); setVideoFile(null); setVideoPreview(''); }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => mode === 'portrait' ? portraitInputRef.current?.click() : videoInputRef.current?.click()}
                      className="w-full aspect-square rounded-xl border-2 border-dashed border-[hsl(230_12%_20%)] flex flex-col items-center justify-center gap-2 hover:border-[hsl(252_60%_55%)]/50 transition-colors">
                      <Upload className="w-8 h-8 text-white/30" />
                      <span className="text-xs text-white/40">Upload {mode === 'portrait' ? 'portrait' : 'video'}</span>
                    </button>
                  )}
                </div>

                {/* Audio Upload */}
                <div>
                  <p className="text-xs font-semibold text-white/40 uppercase mb-2">Audio File</p>
                  <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioFile} className="hidden" />

                  {audioName ? (
                    <div className="w-full aspect-square rounded-xl border-2 border-[hsl(230_12%_20%)] flex flex-col items-center justify-center gap-3 bg-[hsl(230_18%_12%)] relative">
                      <Mic className="w-10 h-10" style={{ color: 'hsl(var(--primary))' }} />
                      <p className="text-xs text-white/40 text-center px-4 truncate max-w-full">{audioName}</p>
                      <button
                        onClick={() => { setAudioFile(null); setAudioName(''); }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/10 text-white/50 hover:bg-white/20">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => audioInputRef.current?.click()}
                      className="w-full aspect-square rounded-xl border-2 border-dashed border-[hsl(230_12%_20%)] flex flex-col items-center justify-center gap-2 hover:border-[hsl(252_60%_55%)]/50 transition-colors">
                      <Mic className="w-8 h-8 text-white/30" />
                      <span className="text-xs text-white/40">Upload audio</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Prompt */}
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
                placeholder="Describe the talking video you want to generate... e.g., 'A professional woman presenting a business pitch, natural lip movement, confident expression'"
                className="w-full px-4 py-3 rounded-xl bg-[hsl(230_18%_12%)] border border-[hsl(230_12%_20%)] text-sm text-white placeholder-white/30 focus:outline-none focus:border-[hsl(252_60%_55%)]/50 mb-4" />

              {/* Generate */}
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, hsl(252 60% 55%) 0%, hsl(252 55% 45%) 100%)', boxShadow: '0 8px 24px -6px hsl(252 60% 55% / 0.4)' }}>
                {generating ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Talking Video</>}
              </motion.button>
            </motion.div>

            {/* Results */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl bg-[hsl(230_18%_10%)] border border-[hsl(230_12%_18%)]" style={{ boxShadow: '0 4px 20px -8px rgb(0 0 0 / 0.3)' }}>
              <h2 className="font-semibold text-white mb-4">Results</h2>

              {results.length === 0 ? (
                <div className="text-center py-12">
                  <Mic className="w-12 h-12 text-[hsl(252_60%_55%)]/20 mx-auto mb-3" />
                  <p className="text-sm font-medium text-white/60">No talking videos yet</p>
                  <p className="text-xs text-white/40 mt-1">Describe a talking video and generate</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {results.map(result => (
                    <motion.div key={result.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="rounded-xl overflow-hidden border border-[hsl(230_12%_18%)]">
                      <div className="aspect-video bg-[hsl(230_18%_12%)] flex items-center justify-center relative">
                        {result.status === 'generating' ? (
                          <div className="text-center">
                            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: 'hsl(var(--primary))' }} />
                            <p className="text-xs text-white/40">Generating...</p>
                          </div>
                        ) : result.status === 'complete' && result.url ? (
                          <>
                            <video src={result.url} controls className="w-full h-full object-cover" />
                            <a href={result.url} download target="_blank" rel="noopener noreferrer"
                              className="absolute bottom-2 right-2 p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20">
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
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-white/40 capitalize">{result.mode}</span>
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
                <div className="flex justify-between text-xs"><span className="text-white/40">Videos Generated</span><span className="font-semibold text-white">{results.filter(r => r.status === 'complete').length}</span></div>
                <div className="flex justify-between text-xs"><span className="text-white/40">Cost</span><span className="font-semibold text-emerald-400">$0.00</span></div>
              </div>
            </motion.div>

            {/* How it works */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="p-5 rounded-2xl bg-gradient-to-br from-[hsl(252_60%_55%)]/10 to-[hsl(152_70%_45%)]/5 border border-[hsl(230_12%_18%)]">
              <h3 className="text-sm font-semibold text-white mb-2">How It Works</h3>
              <ol className="text-xs text-white/40 space-y-1.5 list-decimal list-inside">
                <li>Upload a portrait image or video (optional)</li>
                <li>Upload audio file (optional)</li>
                <li>Describe the talking video you want</li>
                <li>AI generates a talking head video</li>
              </ol>
              <p className="text-[10px] text-white/30 mt-3">Uses Pollinations.ai video generation — no API key needed.</p>
            </motion.div>

            {/* Tips */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="p-5 rounded-2xl bg-[hsl(230_18%_10%)] border border-[hsl(230_12%_18%)]" style={{ boxShadow: '0 4px 20px -8px rgb(0 0 0 / 0.3)' }}>
              <h3 className="text-sm font-semibold text-white mb-3">Prompt Tips</h3>
              <div className="space-y-2 text-xs text-white/40">
                <p>• Include &quot;natural lip movement&quot; for realistic speech</p>
                <p>• Specify the person&apos;s expression (confident, friendly, serious)</p>
                <p>• Mention the setting (office, studio, outdoor)</p>
                <p>• Add &quot;professional lighting&quot; for better quality</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
