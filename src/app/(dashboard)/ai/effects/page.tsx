'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Sparkles, Copy, Check, Download, X, Loader2, Zap } from 'lucide-react';
import { generateVideo } from '@/lib/muapi';

interface EffectPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  prompt: string;
  thumbnail: string;
  color: string;
}

const EFFECT_PRESETS: EffectPreset[] = [
  // Viral Effects
  { id: 'floating-fall', name: 'Floating Fall', description: 'Objects gently falling in zero gravity', category: 'Viral', prompt: 'objects floating and gently falling in zero gravity, slow motion, dreamy atmosphere, cinematic', thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400', color: 'from-blue-500 to-cyan-500' },
  { id: 'melting', name: 'Melting', description: 'Reality melting like wax', category: 'Viral', prompt: 'reality melting like wax, surreal transformation, liquid metal effect, dramatic', thumbnail: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400', color: 'from-orange-500 to-red-500' },
  { id: 'world-morphing', name: 'World Morphing', description: 'Seamless world transformations', category: 'Viral', prompt: 'seamless world transformation, morphing landscape, reality shift, epic', thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400', color: 'from-purple-500 to-pink-500' },
  { id: 'burning-man', name: 'Burning Man', description: 'Epic fire transformations', category: 'Viral', prompt: 'epic fire transformation, burning effect, dramatic flames, cinematic', thumbnail: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=400', color: 'from-red-600 to-orange-600' },
  { id: 'street-colossus', name: 'Street Colossus', description: 'Giant figures in urban settings', category: 'Viral', prompt: 'giant colossus figure walking through city streets, epic scale, cinematic, dramatic', thumbnail: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400', color: 'from-gray-600 to-gray-800' },
  { id: 'wild-ride', name: 'Wild Ride', description: 'Extreme motion and speed', category: 'Viral', prompt: 'extreme motion blur, high speed chase, dynamic camera movement, action', thumbnail: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400', color: 'from-yellow-500 to-orange-500' },
  
  // Cinematic Effects
  { id: 'studio-slide', name: 'Studio Slide', description: 'Professional studio motion', category: 'Cinematic', prompt: 'professional studio lighting, smooth camera slide, cinematic motion, elegant', thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400', color: 'from-indigo-500 to-purple-500' },
  { id: 'incline', name: 'Incline', description: 'Dramatic angle shifts', category: 'Cinematic', prompt: 'dramatic camera angle shift, dutch angle, dynamic composition, cinematic', thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400', color: 'from-teal-500 to-blue-500' },
  { id: 'eyes-in', name: 'Eyes In', description: 'Dramatic zoom to eyes', category: 'Cinematic', prompt: 'dramatic zoom into eyes, intense close-up, emotional reveal, cinematic', thumbnail: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400', color: 'from-pink-500 to-rose-500' },
  { id: 'act-natural', name: 'Act Natural', description: 'Natural human motion', category: 'Cinematic', prompt: 'natural human movement, candid moment, authentic behavior, documentary style', thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400', color: 'from-green-500 to-emerald-500' },
  
  // Surreal Effects
  { id: 'high-flip', name: 'High Flip', description: 'Gravity-defying flips', category: 'Surreal', prompt: 'gravity-defying flip, acrobatic motion, impossible physics, surreal', thumbnail: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400', color: 'from-violet-500 to-purple-500' },
  { id: 'cutout', name: 'Cutout', description: 'Paper cutout animation style', category: 'Surreal', prompt: 'paper cutout animation style, stop motion, layered depth, artistic', thumbnail: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400', color: 'from-amber-500 to-orange-500' },
  { id: 'selfception', name: 'Selfception', description: 'Infinite recursion effect', category: 'Surreal', prompt: 'infinite recursion, droste effect, mirror within mirror, mind-bending', thumbnail: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400', color: 'from-cyan-500 to-blue-500' },
  { id: 'lacewalker', name: 'Lacewalker', description: 'Ethereal walking on patterns', category: 'Surreal', prompt: 'ethereal figure walking on intricate lace patterns, dreamlike, surreal', thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400', color: 'from-slate-500 to-gray-600' },
  { id: 'smash-grab', name: 'Smash & Grab', description: 'Explosive action sequence', category: 'Surreal', prompt: 'explosive action, glass shattering, dynamic impact, high energy', thumbnail: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=400', color: 'from-red-500 to-pink-500' },
  
  // Nature Effects
  { id: 'ice-crystal', name: 'Ice Crystal', description: 'Freezing transformation', category: 'Nature', prompt: 'ice crystal formation, freezing transformation, frost spreading, winter', thumbnail: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=400', color: 'from-cyan-400 to-blue-500' },
  { id: 'ocean-waves', name: 'Ocean Waves', description: 'Powerful wave motion', category: 'Nature', prompt: 'powerful ocean waves, dramatic water motion, epic seascape, nature', thumbnail: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400', color: 'from-blue-500 to-teal-500' },
  { id: 'aurora', name: 'Aurora Dreams', description: 'Northern lights effect', category: 'Nature', prompt: 'aurora borealis, northern lights, ethereal glow, cosmic colors, nature', thumbnail: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=400', color: 'from-green-400 to-purple-500' },
];

const categories = ['All', 'Viral', 'Cinematic', 'Surreal', 'Nature'];

export default function VideoEffectsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<{ effectId: string; url: string; isDemo?: boolean } | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredEffects = selectedCategory === 'All' 
    ? EFFECT_PRESETS 
    : EFFECT_PRESETS.filter(e => e.category === selectedCategory);

  const handleGenerate = async (effect: EffectPreset) => {
    setGeneratingId(effect.id);
    setError(null);
    setGeneratedVideo(null);
    setVideoLoading(true);
    setVideoError(false);

    try {
      const result = await generateVideo(effect.prompt);
      if (result.status === 'error') {
        setError(result.error || 'Video generation failed. Please try again.');
        setVideoLoading(false);
      } else {
        // Always open modal, even if URL is empty (will show thumbnail preview)
        const isDemo = result.model === 'demo-video';
        setGeneratedVideo({ effectId: effect.id, url: result.url || '', isDemo });
        // Give video a moment to start loading
        setTimeout(() => setVideoLoading(false), 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      setVideoLoading(false);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentEffect = generatedVideo ? EFFECT_PRESETS.find(e => e.id === generatedVideo.effectId) : null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-gradient)' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 mb-2" style={{ color: 'hsl(var(--foreground))' }}>
          <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-lg shadow-purple-600/30">
            <Zap className="text-white" size={28} />
          </div>
          Video Effects Studio
        </h1>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              selectedCategory === cat
                ? 'btn-primary'
                : 'btn-secondary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Effects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {filteredEffects.map((effect) => (
          <motion.div
            key={effect.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            className="group relative glass-card overflow-hidden hover:border-[hsl(var(--primary)/0.5)] transition-all cursor-pointer"
            onClick={() => handleGenerate(effect)}
          >
            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden">
              <img
                src={effect.thumbnail}
                alt={effect.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className={`absolute inset-0 bg-gradient-to-br ${effect.color} opacity-20 group-hover:opacity-30 transition-opacity`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Category Badge */}
              <div className="absolute top-3 right-3 px-2 py-1 glass-card-subtle rounded-lg text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                {effect.category}
              </div>

              {/* Generating Overlay */}
              {generatingId === effect.id && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-2" />
                    <p className="text-xs text-white">Generating...</p>
                  </div>
                </div>
              )}

              {/* Play Button */}
              {generatingId !== effect.id && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="p-4 bg-white/20 backdrop-blur-md rounded-full">
                    <Play className="text-white" size={32} fill="white" />
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>{effect.name}</h3>
              <p className="text-sm line-clamp-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{effect.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Generated Video Modal */}
      <AnimatePresence>
        {generatedVideo && currentEffect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'hsl(var(--background) / 0.9)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setGeneratedVideo(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Video/Preview */}
              <div className="relative aspect-video" style={{ background: 'hsl(var(--card))' }}>
                {videoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 animate-spin mx-auto mb-3" style={{ color: 'hsl(var(--primary))' }} />
                      <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Preparing video...</p>
                      <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>This may take a few seconds</p>
                    </div>
                  </div>
                )}
                {!videoLoading && !videoError && !generatedVideo.url && currentEffect && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <img
                      src={currentEffect.thumbnail}
                      alt={currentEffect.name}
                      className="w-full h-full object-cover opacity-50"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="text-center p-6">
                        <Sparkles className="w-12 h-12 mx-auto mb-3" style={{ color: 'hsl(var(--primary))' }} />
                        <p className="text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Video Preview</p>
                        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Connect to internet for full video generation</p>
                      </div>
                    </div>
                  </div>
                )}
                {videoError && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="text-center">
                      <p className="text-sm font-medium text-red-500 mb-2">Video could not load</p>
                      <button
                        onClick={() => {
                          setVideoError(false);
                          setVideoLoading(true);
                          if (currentEffect) handleGenerate(currentEffect);
                        }}
                        className="px-4 py-2 btn-primary text-sm"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                )}
                {generatedVideo.url && (
                  <video
                    src={generatedVideo.url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                    onLoadedData={() => setVideoLoading(false)}
                    onError={() => {
                      setVideoLoading(false);
                      setVideoError(true);
                    }}
                  />
                )}
                <button
                  onClick={() => setGeneratedVideo(null)}
                  className="absolute top-4 right-4 p-2 glass-card-subtle rounded-full hover:opacity-80 transition-colors"
                  style={{ color: 'hsl(var(--foreground))' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-3 py-1 bg-gradient-to-r ${currentEffect.color} rounded-full text-xs font-medium text-white`}>
                    {currentEffect.category}
                  </span>
                  {generatedVideo?.isDemo ? (
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">
                      Demo
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                      Generated
                    </span>
                  )}
                </div>
                
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'hsl(var(--foreground))' }}>{currentEffect.name}</h2>
                <p className="mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>{currentEffect.description}</p>

                {/* Prompt */}
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Effect Prompt</label>
                  <div className="relative">
                    <div className="w-full px-4 py-3 glass-card-subtle rounded-xl text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                      {currentEffect.prompt}
                    </div>
                    <button
                      onClick={() => handleCopyPrompt(currentEffect.prompt)}
                      className="absolute top-3 right-3 p-2 glass-card-subtle hover:opacity-80 rounded-lg transition-colors"
                      title="Copy prompt"
                    >
                      {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-gray-400" />}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <a
                    href={generatedVideo.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 btn-primary font-medium"
                  >
                    <Download size={20} />
                    Download Video
                  </a>
                  <button
                    onClick={() => {
                      setGeneratedVideo(null);
                      handleGenerate(currentEffect);
                    }}
                    className="px-6 py-3 btn-secondary font-medium flex items-center gap-2"
                  >
                    <Sparkles size={20} />
                    Regenerate
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg z-50" style={{ background: 'hsl(var(--error))', color: 'hsl(var(--destructive-foreground))' }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
