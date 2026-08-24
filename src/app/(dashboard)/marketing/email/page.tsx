'use client';
import { useCallback, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Sparkles, Copy, Check, CheckCircle2, AlertCircle,
  Instagram, Youtube, Linkedin, Twitter, Facebook, Video,
  Hash, Zap, TrendingUp, Loader2, X, RefreshCw, Image as ImageIcon,
  Camera, Film, Globe, Eye
} from 'lucide-react';

interface PlatformCaption {
  platform: string;
  caption: string;
  hooks: string[];
  hashtags: string[];
  characterCount: number;
}

interface GeneratedContent {
  topic: string;
  imageAnalysis?: string;
  platforms: PlatformCaption[];
  generalTips: string[];
}

const platformConfig: Record<string, { icon: typeof Instagram; color: string; bgColor: string; maxChars: number; label: string }> = {
  instagram: { icon: Instagram, color: 'text-pink-600 dark:text-pink-400', bgColor: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800', maxChars: 2200, label: 'Instagram' },
  tiktok: { icon: Video, color: 'text-gray-900 dark:text-white', bgColor: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700', maxChars: 300, label: 'TikTok' },
  youtube: { icon: Youtube, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', maxChars: 5000, label: 'YouTube Shorts' },
  linkedin: { icon: Linkedin, color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800', maxChars: 3000, label: 'LinkedIn' },
  twitter: { icon: Twitter, color: 'text-sky-500 dark:text-sky-400', bgColor: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800', maxChars: 280, label: 'X (Twitter)' },
  facebook: { icon: Facebook, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800', maxChars: 63206, label: 'Facebook' },
};

export default function SocialMediaPage() {
  const [topic, setTopic] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [tone, setTone] = useState('engaging');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'tiktok', 'youtube', 'linkedin', 'twitter', 'facebook']);
  const [uploadedMedia, setUploadedMedia] = useState<{ file: File; preview: string; type: 'image' | 'video' } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedMedia({ file, preview: e.target?.result as string, type: 'image' });
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setUploadedMedia({ file, preview: url, type: 'video' });
    } else {
      showToast('Please upload an image or video file', 'error');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const removeMedia = () => {
    if (uploadedMedia?.type === 'video') URL.revokeObjectURL(uploadedMedia.preview);
    setUploadedMedia(null);
  };

  const handleGenerate = async () => {
    if (!topic.trim() && !videoDescription.trim() && !uploadedMedia) {
      showToast('Please enter a topic, describe your content, or upload media', 'error');
      return;
    }
    setGenerating(true);
    setGenerated(null);
    try {
      const body: Record<string, unknown> = {
        topic: topic.trim(),
        videoDescription: videoDescription.trim(),
        tone,
        platforms: selectedPlatforms,
      };

      // Send image as base64 if uploaded
      if (uploadedMedia?.type === 'image' && uploadedMedia.preview) {
        body.imageBase64 = uploadedMedia.preview;
      }

      const res = await fetch('/api/social-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setGenerated(data);
        showToast('Captions generated successfully!');
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed' }));
        showToast(err.error || 'Failed to generate captions', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to generate captions', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (platform: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedPlatform(platform);
    showToast('Copied to clipboard!');
    setTimeout(() => setCopiedPlatform(null), 2000);
  };

  const getFullCaption = (p: PlatformCaption) => {
    const hook = p.hooks[0] ? `${p.hooks[0]}\n\n` : '';
    const hashtags = p.hashtags.length > 0 ? `\n\n${p.hashtags.join(' ')}` : '';
    return `${hook}${p.caption}${hashtags}`;
  };

  const tones = [
    { value: 'engaging', label: 'Engaging & Fun' },
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual & Friendly' },
    { value: 'bold', label: 'Bold & Viral' },
    { value: 'educational', label: 'Educational' },
    { value: 'inspirational', label: 'Inspirational' },
  ];

  return (
    <div className="p-4 md:p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Social Media Caption Generator</h1>
              <p className="text-sm mt-0.5 text-gray-600 dark:text-gray-400">Upload a reel or image. Get platform-optimized captions, hooks & global hashtags — in seconds.</p>
            </div>
          </div>
        </motion.div>

        {/* Input Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Inputs + Upload */}
            <div className="space-y-4">
              {/* Media Upload Area */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-purple-500" /> Upload Image or Video
                </label>
                {!uploadedMedia ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      dragOver
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-300 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600 bg-gray-50 dark:bg-gray-800/50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                    />
                    <Upload className={`w-8 h-8 mx-auto mb-2 ${dragOver ? 'text-purple-500' : 'text-gray-400'}`} />
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {dragOver ? 'Drop your file here' : 'Drag & drop or click to upload'}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">Images (JPG, PNG, WebP) & Videos (MP4, MOV) up to 50MB</p>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                    {uploadedMedia.type === 'image' ? (
                      <img src={uploadedMedia.preview} alt="Uploaded" className="w-full h-40 object-cover" />
                    ) : (
                      <video src={uploadedMedia.preview} className="w-full h-40 object-cover" controls muted />
                    )}
                    <button onClick={removeMedia}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 transition-colors">
                      <X className="w-4 h-4 text-white" />
                    </button>
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/60">
                      {uploadedMedia.type === 'image' ? <ImageIcon className="w-3 h-3 text-white" /> : <Film className="w-3 h-3 text-white" />}
                      <span className="text-[10px] text-white font-medium">{uploadedMedia.file.name}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Topic */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-purple-500" /> What&apos;s your content about? {uploadedMedia ? '(optional)' : ''}
                </label>
                <input
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g., New product launch, Behind the scenes, Tutorial..."
                  className="w-full px-4 py-3 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-purple-500" /> Describe your video/image (optional)
                </label>
                <textarea
                  value={videoDescription}
                  onChange={e => setVideoDescription(e.target.value)}
                  placeholder={uploadedMedia ? "Optional context to help AI. Leave blank and AI will scan your media..." : "What happens in your video? What does your image show?"}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
                />
              </div>

              {/* Tone */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-purple-500" /> Tone
                </label>
                <div className="flex flex-wrap gap-2">
                  {tones.map(t => (
                    <button key={t.value} onClick={() => setTone(t.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        tone === t.value ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Platform Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-purple-500" /> Select Platforms
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(platformConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  const isSelected = selectedPlatforms.includes(key);
                  return (
                    <button key={key} onClick={() => togglePlatform(key)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                        isSelected ? `${config.bgColor} border-2` : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-50'
                      }`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                      <div>
                        <p className={`text-xs font-semibold ${config.color}`}>{config.label}</p>
                        <p className="text-[10px] text-gray-400">{config.maxChars.toLocaleString()} chars max</p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 ml-auto text-emerald-500" />}
                    </button>
                  );
                })}
              </div>

              {/* Global Reach Info */}
              <div className="mt-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">Global Reach Optimized</p>
                </div>
                <p className="text-[10px] text-purple-600/70 dark:text-purple-400/70 leading-relaxed">
                  AI generates trending hashtags for USA, UK, India, UAE, Europe & more. Captions are optimized for global algorithm reach across all selected platforms.
                </p>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button onClick={handleGenerate}
              disabled={generating || (!topic.trim() && !videoDescription.trim() && !uploadedMedia)}
              className="w-full py-3.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-600/20">
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI is analyzing your media & crafting viral captions...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Generate Viral Captions with Global Hashtags
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Generating Animation */}
        {generating && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">AI is working its magic...</p>
                <p className="text-xs text-gray-500">Analyzing your content and crafting platform-specific captions</p>
              </div>
            </div>
            <div className="space-y-2">
              {['Analyzing uploaded media with AI vision...', 'Detecting objects, mood & visual elements...', 'Researching trending hooks for each platform...', 'Writing optimized captions with viral CTAs...', 'Generating global trending hashtags...', 'Finalizing platform-specific formatting...'].map((step, i) => (
                <motion.div key={step} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.6 }}
                  className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                  {step}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Generated Results */}
        <AnimatePresence>
          {generated && !generating && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {/* Image Analysis Result */}
              {generated.imageAnalysis && (
                <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl border border-violet-200 dark:border-violet-800 p-5 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    <h3 className="text-sm font-bold text-violet-900 dark:text-violet-200">AI Vision Analysis</h3>
                  </div>
                  <p className="text-xs text-violet-800 dark:text-violet-300 leading-relaxed">{generated.imageAnalysis}</p>
                </div>
              )}

              {/* General Tips */}
              {generated.generalTips.length > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-5 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">Pro Tips for Maximum Global Reach</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {generated.generalTips.map((tip, i) => (
                      <p key={i} className="text-xs text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                        <span className="text-amber-500 mt-0.5">•</span> {tip}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Platform Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {generated.platforms.map((p, i) => {
                  const config = platformConfig[p.platform];
                  if (!config) return null;
                  const Icon = config.icon;
                  const fullCaption = getFullCaption(p);
                  const isCopied = copiedPlatform === p.platform;

                  return (
                    <motion.div key={p.platform} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      className={`rounded-2xl border p-5 ${config.bgColor}`}>
                      {/* Platform Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-5 h-5 ${config.color}`} />
                          <div>
                            <h3 className={`text-sm font-bold ${config.color}`}>{config.label}</h3>
                            <p className="text-[10px] text-gray-400">{p.characterCount} / {config.maxChars.toLocaleString()} chars</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            p.characterCount <= config.maxChars ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}>
                            {p.characterCount <= config.maxChars ? 'Optimal' : 'Too Long'}
                          </span>
                          <button onClick={() => handleCopy(p.platform, fullCaption)}
                            className="p-1.5 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Copy full caption">
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
                          </button>
                        </div>
                      </div>

                      {/* Hooks */}
                      {p.hooks.length > 0 && (
                        <div className="mb-3">
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Hooks (choose one)</p>
                          <div className="space-y-1">
                            {p.hooks.map((hook, j) => (
                              <p key={j} className="text-xs text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 rounded-lg px-3 py-1.5">{hook}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Caption */}
                      <div className="mb-3">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Caption</p>
                        <p className="text-xs text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 rounded-lg px-3 py-2 leading-relaxed whitespace-pre-wrap">{p.caption}</p>
                      </div>

                      {/* Hashtags */}
                      {p.hashtags.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Global Hashtags</p>
                          <div className="flex flex-wrap gap-1">
                            {p.hashtags.map((tag, j) => (
                              <span key={j} className="px-2 py-0.5 rounded-md text-[10px] bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 font-medium">{tag}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Regenerate */}
              <div className="mt-6 flex justify-center">
                <button onClick={handleGenerate}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                  <RefreshCw className="w-4 h-4" /> Regenerate Captions
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!generated && !generating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Ready to go viral?</p>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Upload an image or video and AI will scan it, then generate captions with global hashtags optimized for every platform. Or enter a topic for text-based captions.
            </p>
            <div className="flex items-center justify-center gap-4 mt-6">
              {[Instagram, Video, Youtube, Linkedin, Twitter, Facebook].map((Icon, i) => (
                <div key={i} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 z-[100] flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl"
            style={{ background: toast.type === 'success' ? 'hsl(142 76% 36%)' : 'hsl(0 72% 51%)', color: 'white' }}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
