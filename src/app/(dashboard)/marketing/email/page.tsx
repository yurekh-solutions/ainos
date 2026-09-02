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
  visionFailed?: boolean;
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
  const [language, setLanguage] = useState('english');
  const [selectedHooks, setSelectedHooks] = useState<Record<string, number>>({});
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'tiktok', 'youtube', 'linkedin', 'twitter', 'facebook']);
  const [uploadedMedia, setUploadedMedia] = useState<{ file: File; preview: string; type: 'image' | 'video'; frame?: string; frames?: string[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanInfo, setScanInfo] = useState<{ niche?: string; mood?: string; detectedObjects?: string[] } | null>(null);
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

  // Grab a representative frame from a video as a base64 JPEG so AI vision can read reels
  // Extract multiple frames from video for better AI analysis
  const extractVideoFrames = (url: string, frameCount: number = 3): Promise<string[]> =>
    new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = url;
      video.muted = true;
      video.crossOrigin = 'anonymous';
      video.playsInline = true;

      const frames: string[] = [];
      let frameIndex = 0;

      const cleanup = () => {
        video.onloadeddata = null;
        video.onseeked = null;
        video.onerror = null;
      };

      const capture = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxWidth = 720;
          const scale = video.videoWidth > maxWidth ? maxWidth / video.videoWidth : 1;
          canvas.width = Math.round(video.videoWidth * scale);
          canvas.height = Math.round(video.videoHeight * scale);
          const ctx = canvas.getContext('2d');
          if (!ctx || !canvas.width || !canvas.height) {
            frameIndex++;
            seekToNextFrame();
            return;
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frames.push(canvas.toDataURL('image/jpeg', 0.8));
          frameIndex++;
          seekToNextFrame();
        } catch {
          frameIndex++;
          seekToNextFrame();
        }
      };

      const seekToNextFrame = () => {
        if (frameIndex >= frameCount) {
          cleanup();
          resolve(frames);
          return;
        }
        const duration = video.duration && isFinite(video.duration) ? video.duration : 0;
        if (duration === 0) {
          cleanup();
          resolve(frames);
          return;
        }
        // Extract frames from different timestamps: 10%, 50%, 90% of video
        const timestamps = [0.1, 0.5, 0.9];
        const target = duration * timestamps[frameIndex];
        video.currentTime = Math.max(0.5, Math.min(target, duration - 0.1));
      };

      video.onloadeddata = () => seekToNextFrame();
      video.onseeked = capture;
      video.onerror = () => { cleanup(); resolve(frames); };

      setTimeout(() => { cleanup(); resolve(frames); }, 10000);
    });

  // Scan the media with AI and auto-fill topic + description
  const autoFillFromMedia = async (base64: string, type: 'image' | 'video') => {
    setAnalyzing(true);
    setScanInfo(null);
    try {
      const res = await fetch('/api/social-caption/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType: type }),
      });
      if (!res.ok) {
        const msg = res.status === 503
          ? 'AI scan is unavailable right now — fill the fields manually'
          : 'Could not scan media — fill the fields manually';
        showToast(msg, 'error');
        return;
      }
      const data = await res.json();
      if (data.topic) setTopic(data.topic);
      if (data.description) setVideoDescription(data.description);
      setScanInfo({ niche: data.niche, mood: data.mood, detectedObjects: data.detectedObjects });
      if (data.topic || data.description) showToast('AI scanned your media and filled the details!');
    } catch (e) {
      console.error(e);
      showToast('Could not scan media — fill the fields manually', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setUploadedMedia({ file, preview: base64, type: 'image' });
        // No auto AI scan — user fills topic/description manually.
        // Optional "Re-scan with AI" button available on the preview.
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setUploadedMedia({ file, preview: url, type: 'video' });
      const frames = await extractVideoFrames(url, 3);
      if (frames.length > 0) {
        setUploadedMedia({ file, preview: url, type: 'video', frames });
      }
      // No auto AI scan — user fills topic/description manually.
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
    setScanInfo(null);
  };

  const rescanMedia = () => {
    const base64 = uploadedMedia?.type === 'image' ? uploadedMedia.preview : uploadedMedia?.frame;
    if (base64 && uploadedMedia) autoFillFromMedia(base64, uploadedMedia.type);
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
        language,
        platforms: selectedPlatforms,
      };

      // Send image (or extracted video frames) as base64 if uploaded
      if (uploadedMedia?.type === 'image') {
        body.imageBase64 = uploadedMedia.preview;
      } else if (uploadedMedia?.type === 'video' && uploadedMedia.frames && uploadedMedia.frames.length > 0) {
        body.imageBase64 = uploadedMedia.frames; // Send multiple frames for video
      } else if (uploadedMedia?.type === 'video' && uploadedMedia.frame) {
        body.imageBase64 = uploadedMedia.frame; // Fallback to single frame
      }

      const res = await fetch('/api/social-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        if (!Array.isArray(data.platforms) || data.platforms.length === 0) {
          showToast('AI returned no captions — please regenerate', 'error');
        } else {
          setSelectedHooks({});
          setGenerated(data);
          showToast('Captions generated successfully!');
        }
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed' }));
        showToast(err.error || 'Failed to generate captions', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to generate captions — please try again', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const copyText = async (content: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(content);
      return true;
    } catch {
      // Fallback for non-secure contexts / older browsers
      try {
        const ta = document.createElement('textarea');
        ta.value = content;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch {
        return false;
      }
    }
  };

  const handleCopy = async (platform: string, content: string) => {
    const ok = await copyText(content);
    if (!ok) { showToast('Copy failed — please select and copy manually', 'error'); return; }
    setCopiedPlatform(platform);
    showToast('Copied to clipboard!');
    setTimeout(() => setCopiedPlatform(null), 2000);
  };

  const getFullCaption = (p: PlatformCaption) => {
    const hookIdx = selectedHooks[p.platform] ?? 0;
    const hook = p.hooks?.[hookIdx] ? `${p.hooks[hookIdx]}\n\n` : '';
    const hashtags = (p.hashtags?.length ?? 0) > 0 ? `\n\n${p.hashtags.join(' ')}` : '';
    return `${hook}${p.caption ?? ''}${hashtags}`;
  };

  const getFullLength = (p: PlatformCaption) => getFullCaption(p).length;

  const tones = [
    { value: 'engaging', label: 'Engaging & Fun' },
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual & Friendly' },
    { value: 'bold', label: 'Bold & Viral' },
    { value: 'educational', label: 'Educational' },
    { value: 'inspirational', label: 'Inspirational' },
  ];

  const languages = [
    { value: 'english', label: 'English' },
    { value: 'hinglish', label: 'Hinglish' },
    { value: 'hindi', label: 'हिंदी (Hindi)' },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-4 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">Social Media Caption Generator</h1>
              <p className="text-xs sm:text-sm mt-0.5 text-gray-600 dark:text-gray-400">Upload a reel or image. Get platform-optimized captions, hooks &amp; global hashtags.</p>
            </div>
          </div>
        </motion.div>

        {/* Input Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
                    role="button"
                    tabIndex={0}
                    aria-label="Upload image or video file"
                    className={`relative border-2 border-dashed rounded-xl p-4 sm:p-6 text-center cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
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
                    <p className="text-[10px] text-gray-400 mt-1">Images (JPG, PNG, WebP) &amp; Videos (MP4, MOV) up to 50MB</p>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                    {uploadedMedia.type === 'image' ? (
                      <img src={uploadedMedia.preview} alt={`Uploaded ${uploadedMedia.type}: ${uploadedMedia.file.name}`} className="w-full h-32 sm:h-40 object-cover" />
                    ) : (
                      <video src={uploadedMedia.preview} className="w-full h-32 sm:h-40 object-cover" controls muted aria-label={`Uploaded video: ${uploadedMedia.file.name}`} />
                    )}
                    <button onClick={removeMedia}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 transition-colors"
                      aria-label="Remove uploaded media">
                      <X className="w-4 h-4 text-white" />
                    </button>
                    <button onClick={rescanMedia} disabled={analyzing}
                      className="absolute top-2 right-11 p-1.5 rounded-full bg-black/60 hover:bg-black/80 disabled:opacity-40 transition-colors"
                      aria-label="Re-scan media with AI"
                      title="Re-scan with AI">
                      <RefreshCw className={`w-4 h-4 text-white ${analyzing ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/60">
                      {uploadedMedia.type === 'image' ? <ImageIcon className="w-3 h-3 text-white" /> : <Film className="w-3 h-3 text-white" />}
                      <span className="text-[10px] text-white font-medium">{uploadedMedia.file.name}</span>
                    </div>
                    {analyzing && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 backdrop-blur-sm">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                        <p className="text-xs font-medium text-white">
                          AI is scanning your {uploadedMedia.type === 'video' ? 'reel' : 'image'}...
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* What the AI detected */}
                {scanInfo && !analyzing && (uploadedMedia !== null) && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> AI detected
                    </span>
                    {scanInfo.niche && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">{scanInfo.niche}</span>
                    )}
                    {scanInfo.mood && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300">{scanInfo.mood}</span>
                    )}
                    {(scanInfo.detectedObjects || []).slice(0, 4).map((o, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{o}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Topic */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-purple-500" /> What&apos;s your content about? {uploadedMedia ? '(optional)' : ''}
                  {analyzing && <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-normal text-purple-500"><Loader2 className="w-3 h-3 animate-spin" /> auto-filling</span>}
                </label>
                <input
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder={uploadedMedia ? 'Edit freely or leave blank' : 'e.g., New product launch, Behind the scenes, Tutorial...'}
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
                  placeholder={uploadedMedia ? 'Edit freely or describe in your own words' : 'What happens in your video? What does your image show?'}
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
                      aria-pressed={tone === t.value}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        tone === t.value ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption Language */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-purple-500" /> Caption Language
                </label>
                <div className="flex flex-wrap gap-2">
                  {languages.map(l => (
                    <button key={l.value} onClick={() => setLanguage(l.value)}
                      aria-pressed={language === l.value}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        language === l.value ? 'bg-pink-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}>
                      {l.label}
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
                      aria-pressed={isSelected}
                      className={`flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl border text-left transition-all ${
                        isSelected ? `${config.bgColor} border-2` : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-50'
                      }`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                      <div>
                        <p className={`text-xs font-semibold ${config.color}`}>{config.label}</p>
                        <p className="text-[10px] text-gray-400">{config.label}</p>
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
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-800">
            <button onClick={handleGenerate}
              aria-busy={generating || analyzing}
              disabled={generating || analyzing || selectedPlatforms.length === 0 || (!topic.trim() && !videoDescription.trim() && !uploadedMedia)}
              className="w-full py-3 sm:py-3.5 rounded-xl text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-600/20">
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="truncate">Scanning media...</span>
                </>
              ) : generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="truncate sm:hidden">Generating captions...</span>
                  <span className="hidden sm:inline">AI is analyzing your media &amp; crafting viral captions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span className="truncate sm:hidden">Generate Viral Captions</span>
                  <span className="hidden sm:inline">Generate Viral Captions with Global Hashtags</span>
                </>
              )}
            </button>
            {selectedPlatforms.length === 0 && (
              <p className="mt-2 text-center text-[11px] text-amber-600 dark:text-amber-400">Select at least one platform to generate captions</p>
            )}
          </div>
        </motion.div>

        {/* Generating Animation */}
        {generating && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 mb-4 sm:mb-6">
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
                <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl border border-violet-200 dark:border-violet-800 p-4 sm:p-5 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    <h3 className="text-sm font-bold text-violet-900 dark:text-violet-200">AI Vision Analysis</h3>
                  </div>
                  <p className="text-xs text-violet-800 dark:text-violet-300 leading-relaxed">{generated.imageAnalysis}</p>
                </div>
              )}

              {/* Vision fallback note */}
              {generated.visionFailed && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-4 mb-4 sm:mb-6 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                    AI media scan is temporarily unavailable, so captions were crafted from your topic &amp; description. Edit them above or regenerate in a few minutes.
                  </p>
                </div>
              )}

              {/* General Tips */}
              {(generated.generalTips?.length ?? 0) > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-4 sm:p-5 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">Pro Tips for Maximum Global Reach</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(generated.generalTips ?? []).map((tip, i) => (
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
                  const fullLength = getFullLength(p);
                  const isCopied = copiedPlatform === p.platform;
                  const hooks = p.hooks ?? [];
                  const hashtags = p.hashtags ?? [];
                  const selectedHookIdx = selectedHooks[p.platform] ?? 0;

                  return (
                    <motion.div key={p.platform} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      className={`rounded-2xl border p-4 sm:p-5 ${config.bgColor}`}>
                      {/* Platform Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-5 h-5 ${config.color}`} />
                          <div>
                            <h3 className={`text-sm font-bold ${config.color}`}>{config.label}</h3>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleCopy(p.platform, fullCaption)}
                            className="p-1.5 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            aria-label={`Copy full ${config.label} caption`} title="Copy full caption">
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
                          </button>
                        </div>
                      </div>

                      {/* Hooks — tap to pick the one included in the copied caption */}
                      {hooks.length > 0 && (
                        <div className="mb-3">
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Hooks — tap to use in copy</p>
                          <div className="space-y-1">
                            {hooks.map((hook, j) => (
                              <button key={j} onClick={() => setSelectedHooks(prev => ({ ...prev, [p.platform]: j }))}
                                className={`w-full text-left text-xs rounded-lg px-3 py-1.5 transition-all border ${
                                  selectedHookIdx === j
                                    ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-semibold'
                                    : 'bg-white/50 dark:bg-gray-800/50 border-transparent text-gray-700 dark:text-gray-300 hover:border-purple-200 dark:hover:border-purple-800'
                                }`}>
                                {hook}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Caption */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Caption</p>
                          {p.caption && (
                            <button onClick={() => handleCopy(`${p.platform}-caption`, p.caption)}
                              className="p-1 rounded-md hover:bg-white/70 dark:hover:bg-gray-800 transition-colors"
                              aria-label={`Copy ${config.label} caption only`} title="Copy caption only">
                              {copiedPlatform === `${p.platform}-caption` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 rounded-lg px-3 py-2 leading-relaxed whitespace-pre-wrap">{p.caption || '—'}</p>
                      </div>

                      {/* Hashtags */}
                      {hashtags.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Global Hashtags</p>
                            <button onClick={() => handleCopy(`${p.platform}-hashtags`, hashtags.join(' '))}
                              className="p-1 rounded-md hover:bg-white/70 dark:hover:bg-gray-800 transition-colors"
                              aria-label={`Copy ${config.label} hashtags only`} title="Copy hashtags only">
                              {copiedPlatform === `${p.platform}-hashtags` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {hashtags.map((tag, j) => (
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
                  className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                  <RefreshCw className="w-4 h-4" /> Regenerate Captions
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!generated && !generating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-10 sm:py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1">Ready to go viral?</p>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto px-4">
              Upload an image or video, then generate captions with global hashtags optimized for every platform. Or enter a topic for text-based captions.
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
            role="status"
            aria-live="polite"
            className="fixed bottom-4 sm:bottom-6 left-1/2 z-[100] flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl shadow-2xl max-w-[90vw]"
            style={{ background: toast.type === 'success' ? 'hsl(142 76% 36%)' : 'hsl(0 72% 51%)', color: 'white' }}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
