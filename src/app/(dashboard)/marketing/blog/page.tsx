'use client';
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { isAdmin } from '@/lib/admin';
import {
  X, FileText, Eye, Calendar, Sparkles, Wand2, Search,
  Clock, Trash2, Edit3, CheckCircle, Send, ArrowLeft,
  BookOpen, Layers, ExternalLink, Globe, CalendarRange, TrendingUp, Shield, Zap,
  Code, Copy, Check, Rss, Map, Palette, RefreshCw
} from 'lucide-react';

interface BlogPost {
  id: string; title: string; slug: string; content: string; excerpt: string | null;
  status: string; author: string | null; featuredImage: string | null;
  category: string | null; publishedAt: string | null; scheduledAt: string | null;
  tags: string[] | null; views?: number; createdAt: string;
  isSchedule?: boolean;
  company?: { name: string | null; id: string } | null;
}
interface GeneratedPost {
  title: string; slug: string; excerpt: string; content: string;
  tags: string[]; category: string; featuredImage: string;
  seoScore?: number; seoTips?: string[];
}

const tones = ['Professional', 'Casual', 'Authoritative', 'Friendly', 'Technical', 'Conversational'];
const industries = ['Technology', 'Healthcare', 'Finance', 'E-commerce', 'Education', 'Real Estate', 'Marketing', 'Manufacturing', 'SaaS', 'General Business'];
const lengths = [
  { value: 'short', label: 'Short (400-500 words)' },
  { value: 'medium', label: 'Medium (700-900 words)' },
  { value: 'long', label: 'Long (1200-1500 words)' },
  { value: 'extra-long', label: 'Extra Long (2800-3200 words)' }
];

// Friendly, non-developer step-by-step guides per website builder
const platformSteps: Record<string, string[]> = {
  'WordPress': [
    'Open the page where you want your blogs (Pages → Add New or edit any page).',
    'Click the + button and choose “Custom HTML”.',
    'Paste the code and press Publish. Done!',
  ],
  'Shopify': [
    'Go to Online Store → Pages and open any page.',
    'Click the “Show HTML” button in the editor.',
    'Paste the code and press Save. Done!',
  ],
  'Wix': [
    'In your editor, click Add → Embed → “Embed Code”.',
    'Paste the code in the box.',
    'Publish your site. Done!',
  ],
  'Other / Not sure': [
    'Open your website editor — any platform works.',
    'Paste the code anywhere on the page (bottom of the page is best).',
    'Save or publish. The widget does the rest!',
  ],
};

// Simple markdown to HTML converter
function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-6 mb-2 text-gray-900 dark:text-white">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-8 mb-3 text-gray-900 dark:text-white">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 mb-1 text-gray-700 dark:text-gray-300">• $1</li>')
    .replace(/^(?!<)(.*$)/gm, '<p class="mb-3 text-gray-700 dark:text-gray-300 leading-relaxed">$1</p>')
    .replace(/<p class="mb-3.*?><\/p>/g, '');
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [showReader, setShowReader] = useState<BlogPost | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedPost | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [scheduleDate, setScheduleDate] = useState('');
  const [showEmbed, setShowEmbed] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');
  const [embedPlatform, setEmbedPlatform] = useState('WordPress');
  const [embedStyle, setEmbedStyle] = useState<'grid' | 'list'>('grid');
  const [embedLimit, setEmbedLimit] = useState(6);
  const [embedColor, setEmbedColor] = useState('');
  const [platformMode, setPlatformMode] = useState(false);

  // Platform-wide view is admin-only (platform owner account)
  const { data: session } = useSession();
  const isAdminUser = isAdmin(session?.user?.email);
  
  // Initialize baseUrl with the correct production URL
  const baseUrl = (() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      if (origin.includes('onrender.com') || origin.includes('vercel.app')) {
        return origin;
      }
    }
    return 'https://ainos-ywu0.onrender.com';
  })();

  // Live embed snippet — updates as the user picks layout/count/color
  const embedSnippet = `<script src="${baseUrl}/embed.js"></script>\n<div id="ainos-blog" data-limit="${embedLimit}" data-style="${embedStyle}"${embedColor ? ` data-color="${embedColor}"` : ''}></div>`;

  const [aiForm, setAiForm] = useState({
    topic: '', keywords: '', tone: 'Professional', length: 'medium', industry: 'General Business'
  });

  const fetchPosts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (activeCategory !== 'All') params.set('category', activeCategory);
      if (platformMode) params.set('platform', 'true');
      const res = await fetch(`/api/blog-posts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        setCategories(data.categories || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [statusFilter, activeCategory, platformMode]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]); // eslint-disable-line

  // AI Blog Generation
  const handleGenerate = async () => {
    if (!aiForm.topic.trim()) return;
    setGenerating(true);
    setGenerated(null);
    try {
      const res = await fetch('/api/blog-posts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiForm),
      });
      if (res.ok) {
        const data = await res.json();
        setGenerated(data);
      }
    } catch (e) { console.error(e); }
    finally { setGenerating(false); }
  };

  // Save as draft
  const handleSaveDraft = async () => {
    if (!generated) return;
    try {
      const res = await fetch('/api/blog-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...generated, status: 'draft' }),
      });
      if (res.ok) {
        setGenerated(null); setShowAI(false);
        setAiForm({ topic: '', keywords: '', tone: 'Professional', length: 'medium', industry: 'General Business' });
        fetchPosts();
      }
    } catch (e) { console.error(e); }
  };

  // Publish directly
  const handlePublish = async () => {
    if (!generated) return;
    try {
      const res = await fetch('/api/blog-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...generated, status: 'published', publishedAt: new Date().toISOString() }),
      });
      if (res.ok) {
        setGenerated(null); setShowAI(false); setScheduleDate('');
        setAiForm({ topic: '', keywords: '', tone: 'Professional', length: 'medium', industry: 'General Business' });
        fetchPosts();
      }
    } catch (e) { console.error(e); }
  };

  // Schedule post
  const handleSchedule = async () => {
    if (!generated || !scheduleDate) return;
    try {
      const res = await fetch('/api/blog-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...generated, status: 'scheduled', scheduledAt: new Date(scheduleDate).toISOString(),
        }),
      });
      if (res.ok) {
        setGenerated(null); setShowAI(false); setScheduleDate('');
        setAiForm({ topic: '', keywords: '', tone: 'Professional', length: 'medium', industry: 'General Business' });
        fetchPosts();
      }
    } catch (e) { console.error(e); }
  };

  // Update post status
  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const data = status === 'published' ? { status, publishedAt: new Date().toISOString() } : { status };
      const res = await fetch(`/api/blog-posts?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) fetchPosts();
    } catch (e) { console.error(e); }
  };

  // Copy embed code to clipboard
  const handleCopyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(''), 2000);
    } catch (e) { console.error(e); }
  };

  // Delete post
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blog post?')) return;
    try {
      const res = await fetch(`/api/blog-posts?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchPosts();
    } catch (e) { console.error(e); }
  };

  // Regenerate post content + image with AI
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const handleRegenerate = async (id: string) => {
    if (!confirm('Regenerate this blog with AI? Current content and image will be replaced.')) return;
    setRegenerating(id);
    try {
      const res = await fetch(`/api/blog-posts/regenerate?id=${id}`, { method: 'POST' });
      if (res.ok) {
        fetchPosts();
        setShowReader(null);
      } else {
        const d = await res.json().catch(() => null);
        alert((d && d.error) || 'Regeneration failed — please try again.');
      }
    } catch (e) { console.error(e); }
    setRegenerating(null);
  };

  const filtered = posts.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase())
      || (p.excerpt || '').toLowerCase().includes(search.toLowerCase())
      || (p.category || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const totalViews = posts.reduce((s, p) => s + (p.views || 0), 0);
  const publishedCount = posts.filter(p => p.status === 'published').length;
  const draftCount = posts.filter(p => p.status === 'draft').length;
  const scheduledCount = posts.filter(p => p.status === 'scheduled').length;

  // All categories for tabs
  const allCategories = ['All', ...categories];

  // Calendar helper: group posts by date
  const getCalendarDays = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: { date: Date; posts: BlogPost[] }[] = [];
    // Pad start
    for (let i = 0; i < firstDay.getDay(); i++) {
      const d = new Date(year, month, -firstDay.getDay() + i + 1);
      days.push({ date: d, posts: [] });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split('T')[0];
      const dayPosts = posts.filter(p => {
        const pDate = (p.scheduledAt || p.publishedAt || '').split('T')[0];
        return pDate === dateStr;
      });
      days.push({ date, posts: dayPosts });
    }
    return days;
  };

  return (
    <div className="h-full overflow-auto bg-gray-50 dark:bg-gray-950">
      {/* ═══════════ TOP ACTION BAR ═══════════ */}
      <div className="flex items-center justify-between px-6 py-3 md:px-10 bg-white dark:bg-gray-900 border-b border-gray-200/80 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-bold text-slate-900 dark:text-white">AI Blog Agent</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 uppercase tracking-wider">AUTOPILOT</span>
          {/* Platform-wide toggle — admin only */}
          {isAdminUser && (
          <div className="ml-3 flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700">
            <button onClick={() => setPlatformMode(false)}
              className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                !platformMode ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}>
              My Blogs
            </button>
            <button onClick={() => setPlatformMode(true)}
              className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                platformMode ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}>
              <Globe className="w-3 h-3" /> Platform
            </button>
          </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setShowAI(true); setGenerated(null); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md shadow-purple-500/20 transition-all">
            <Wand2 className="w-3.5 h-3.5" /> Generate with AI
          </motion.button>
        </div>
      </div>

      {/* ═══════════ HERO BANNER ═══════════ */}
      <div className="relative bg-gradient-to-br from-[#1a1040] via-[#2d1b69] to-[#3b1f8e] dark:from-[#0f0a2e] dark:via-[#1a1040] dark:to-[#2d1b69] overflow-hidden">
        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-20">
          <svg viewBox="0 0 1440 80" fill="none" className="absolute bottom-0 w-full h-full">
            <path d="M0 40C240 10 480 70 720 40C960 10 1200 70 1440 40V80H0V40Z" fill="rgba(255,255,255,0.03)" />
            <path d="M0 50C240 20 480 80 720 50C960 20 1200 80 1440 50V80H0V50Z" fill="rgba(255,255,255,0.02)" />
          </svg>
        </div>

        <div className="relative px-4 py-8 sm:px-6 sm:py-10 md:px-10 md:py-14 max-w-[1400px] mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            {/* Left content */}
            <div className="max-w-lg">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 backdrop-blur-sm flex items-center justify-center border border-purple-400/20 mb-5">
                  <Sparkles className="w-5 h-5 text-purple-300" />
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight leading-[1.2]">
                  AI SEO Insights &<br />
                  Growth <span className="text-purple-400">Strategies</span>
                </h1>
                <p className="text-sm text-white/60 max-w-md leading-relaxed">
                  Generate SEO-optimized blog posts with AI, publish them with beautiful featured images, and drive organic traffic.
                </p>
              </motion.div>
            </div>

            {/* Right illustration */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:block flex-shrink-0">
              <div className="relative w-[280px] h-[200px]">
                {/* Orbital lines */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 280 200">
                  <ellipse cx="140" cy="100" rx="100" ry="60" fill="none" stroke="rgba(168,85,247,0.15)" strokeWidth="1" strokeDasharray="4 4" />
                  <ellipse cx="140" cy="100" rx="70" ry="40" fill="none" stroke="rgba(168,85,247,0.1)" strokeWidth="1" strokeDasharray="3 3" />
                </svg>
                {/* Main document card */}
                <div className="absolute top-4 left-8 w-[160px] h-[130px] bg-white/[0.08] backdrop-blur-sm rounded-2xl border border-white/[0.12] p-4 shadow-2xl">
                  <div className="w-full h-3 bg-white/[0.1] rounded mb-2" />
                  <div className="w-3/4 h-2 bg-white/[0.06] rounded mb-3" />
                  <div className="w-full h-[60px] bg-white/[0.04] rounded-xl mb-2 flex items-center justify-center border border-white/[0.06]">
                    <div className="w-8 h-8 rounded-lg bg-purple-400/20 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-purple-300/70" />
                    </div>
                  </div>
                  <div className="w-1/2 h-2 bg-white/[0.06] rounded" />
                </div>
                {/* Floating icons */}
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute top-0 right-4 w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40 border border-blue-400/30">
                  <Edit3 className="w-4 h-4 text-white" />
                </motion.div>
                <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  className="absolute bottom-4 right-0 w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/40 border border-emerald-400/30">
                  <CheckCircle className="w-4 h-4 text-white" />
                </motion.div>
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className="absolute top-12 left-0 w-9 h-9 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/40 border border-purple-400/30">
                  <Globe className="w-4 h-4 text-white" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ═══════════ STATS CARDS (overlap hero) ═══════════ */}
      <div className="px-4 sm:px-6 md:px-10 max-w-[1400px] mx-auto -mt-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          {[
            { label: 'Total Posts', value: posts.length, sub: 'All Content', icon: FileText, iconBg: 'bg-purple-100', iconColor: 'text-purple-600', subColor: 'text-purple-500' },
            { label: 'Published', value: publishedCount, sub: 'Live Now', icon: CheckCircle, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', subColor: 'text-emerald-500' },
            { label: 'Scheduled', value: scheduledCount, sub: 'Upcoming', icon: CalendarRange, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', subColor: 'text-blue-500' },
            { label: 'Drafts', value: draftCount, sub: 'In Progress', icon: Edit3, iconBg: 'bg-orange-100', iconColor: 'text-orange-600', subColor: 'text-orange-500' },
            { label: 'Total Views', value: totalViews, sub: 'All Time', icon: Eye, iconBg: 'bg-pink-100', iconColor: 'text-pink-600', subColor: 'text-pink-500' },
          ].map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.08 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <s.icon className={`w-5 h-5 ${s.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">{s.value}</p>
                  <p className={`text-[11px] font-medium ${s.subColor}`}>{s.sub}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4 sm:px-6 sm:py-6 md:px-10 max-w-[1400px] mx-auto">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-sm" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-sm">
            <option value="">All Status</option>
            <option value="draft">Drafts</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
          </select>
          {/* View Toggle */}
          <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <button onClick={() => setViewMode('grid')}
              className={`px-3 py-2.5 text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              <FileText className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('calendar')}
              className={`px-3 py-2.5 text-sm font-medium transition-colors ${viewMode === 'calendar' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              <CalendarRange className="w-4 h-4" />
            </button>
          </div>
          {/* Publish to Website Button — hidden in platform view (it applies to your own site only) */}
          {!platformMode && (
          <button onClick={() => setShowEmbed(true)}
            className="px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all flex items-center gap-2">
            <Globe className="w-4 h-4" /> Publish to Website
          </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {allCategories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-purple-300 hover:text-purple-600'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Blog Posts Grid / Calendar View */}
        {viewMode === 'calendar' ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarRange className="w-5 h-5 text-purple-600" />
                Content Calendar — {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
            </div>
            <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-800">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="bg-gray-50 dark:bg-gray-900 p-2 text-center text-xs font-semibold text-gray-500">{d}</div>
              ))}
              {getCalendarDays().map((day, i) => {
                const isToday = day.date.toDateString() === new Date().toDateString();
                const isCurrentMonth = day.date.getMonth() === new Date().getMonth();
                return (
                  <div key={i} className={`bg-white dark:bg-gray-900 p-1.5 min-h-[80px] ${!isCurrentMonth ? 'opacity-40' : ''}`}>
                    <span className={`text-xs font-medium ${isToday ? 'w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center' : 'text-gray-500'}`}>
                      {day.date.getDate()}
                    </span>
                    {day.posts.map(p => (
                      <div key={p.id} className={`mt-1 px-1.5 py-0.5 rounded text-[10px] truncate cursor-pointer ${
                        p.status === 'published' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                        : p.status === 'scheduled' ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-500'
                      }`} onClick={() => setShowReader(p)} title={p.title}>
                        {p.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        ) : loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading articles...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No articles found</p>
            <p className="text-sm text-gray-500 mb-6">Try adjusting your search or generate your first AI blog post</p>
            <button onClick={() => { setShowAI(true); setGenerated(null); }}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Generate with AI
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post, i) => (
              <motion.article key={post.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-300 cursor-pointer"
                onClick={() => setShowReader(post)}>
                {/* Featured image (branded placeholder for queued blogs) */}
                {post.featuredImage ? (
                  <div className="h-40 overflow-hidden rounded-t-2xl">
                    <img src={post.featuredImage} alt={post.title} loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className="h-40 rounded-t-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-indigo-800 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-white/40" />
                  </div>
                )}
                {/* Content */}
                <div className="p-6">
                  {/* Status + Category Row */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      post.status === 'published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : post.status === 'draft' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                    }`}>{post.status}</span>
                    {post.category && (
                      <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-md">
                        {post.category}
                      </span>
                    )}
                  </div>
                  {/* Platform-mode: show which company/user this blog belongs to */}
                  {platformMode && post.company?.name && (
                    <div className="mb-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <Globe className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 truncate max-w-[180px]">{post.company.name}</span>
                    </div>
                  )}
                  <h3 className="font-bold text-base text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{post.excerpt}</p>
                  )}
                  {/* Tags */}
                  {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {post.tags.slice(0, 3).map((tag, j) => (
                        <span key={j} className="px-2 py-0.5 rounded-md text-[10px] bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-medium">
                          #{tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="text-[10px] text-gray-400">+{post.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                  {/* Meta */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      {post.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                      {!post.isSchedule && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />{Math.max(1, Math.ceil((post.content || '').split(' ').length / 200))} min
                        </span>
                      )}
                      {post.isSchedule && (
                        <span className="flex items-center gap-1 text-emerald-500">
                          <Zap className="w-3 h-3" />Preparing
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {post.status === 'published' && (
                        <a href={`/blog/${post.slug}/`} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20" title="View Public Post">
                          <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                        </a>
                      )}
                      {post.status === 'draft' && (
                        <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(post.id, 'published'); }}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20" title="Publish">
                          <Send className="w-3.5 h-3.5 text-emerald-500" />
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); handleRegenerate(post.id); }}
                        disabled={regenerating === post.id}
                        className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20" title="Regenerate with AI">
                        <RefreshCw className={`w-3.5 h-3.5 text-purple-500 ${regenerating === post.id ? 'animate-spin' : ''}`} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      {/* AI Generation Modal */}
      <AnimatePresence>
        {showAI && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !generating && setShowAI(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-3xl border border-gray-200 dark:border-gray-800 shadow-2xl max-h-[90vh] overflow-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <Wand2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">AI Blog Agent</h2>
                      <p className="text-xs text-gray-500">Research, write & publish SEO-optimized content</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAI(false)} disabled={generating}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {!generated ? (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Blog Topic *</label>
                      <input value={aiForm.topic} onChange={e => setAiForm({ ...aiForm, topic: e.target.value })}
                        placeholder="e.g., How AI is Transforming Small Business Operations in 2025"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">SEO Keywords</label>
                      <input value={aiForm.keywords} onChange={e => setAiForm({ ...aiForm, keywords: e.target.value })}
                        placeholder="e.g., AI for business, small business automation, business tools"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tone</label>
                        <select value={aiForm.tone} onChange={e => setAiForm({ ...aiForm, tone: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500">
                          {tones.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Length</label>
                        <select value={aiForm.length} onChange={e => setAiForm({ ...aiForm, length: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500">
                          {lengths.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Industry</label>
                        <select value={aiForm.industry} onChange={e => setAiForm({ ...aiForm, industry: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500">
                          {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                        </select>
                      </div>
                    </div>

                    <button onClick={handleGenerate} disabled={!aiForm.topic.trim() || generating}
                      className="w-full py-3.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-600/20 mt-2">
                      {generating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          AI is researching & writing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" /> Generate SEO Blog Post
                        </>
                      )}
                    </button>

                    {generating && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-xl p-5 border border-purple-100 dark:border-purple-900/30">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                          <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">AI Blog Agent is working...</p>
                        </div>
                        <div className="space-y-1.5 text-xs text-purple-600/70 dark:text-purple-400/70">
                          <p>• Researching topic & analyzing keywords...</p>
                          <p>• Writing SEO-optimized content with headings...</p>
                          <p>• Generating featured image...</p>
                          <p>• Creating meta description & tags...</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Success banner */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/30">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Blog post generated successfully!</p>
                      </div>
                      <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Review and edit below, then publish or save as draft</p>
                    </div>

                    {/* SEO Score */}
                    {generated.seoScore && (
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">SEO / AEO Score</span>
                          </div>
                          <span className={`text-2xl font-bold ${
                            generated.seoScore >= 80 ? 'text-emerald-600' : generated.seoScore >= 60 ? 'text-amber-600' : 'text-red-600'
                          }`}>{generated.seoScore}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                          <div className={`h-2 rounded-full transition-all ${
                            generated.seoScore >= 80 ? 'bg-emerald-500' : generated.seoScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                          }`} style={{ width: `${generated.seoScore}%` }} />
                        </div>
                        {generated.seoTips && generated.seoTips.length > 0 && (
                          <div className="space-y-1">
                            {generated.seoTips.map((tip, i) => (
                              <p key={i} className="text-xs text-gray-500 flex items-center gap-1.5">
                                <Shield className="w-3 h-3 text-purple-400 flex-shrink-0" /> {tip}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Featured Image Preview */}
                    {generated.featuredImage && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Featured Image</label>
                        <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                          <img src={generated.featuredImage} alt="Generated" className="w-full aspect-[16/9] object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
                      <input value={generated.title} onChange={e => setGenerated({ ...generated, title: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Slug</label>
                        <input value={generated.slug} onChange={e => setGenerated({ ...generated, slug: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                        <input value={generated.category || ''} onChange={e => setGenerated({ ...generated, category: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Meta Description (SEO)</label>
                      <textarea value={generated.excerpt} onChange={e => setGenerated({ ...generated, excerpt: e.target.value })} rows={2}
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none" />
                      <p className="text-[10px] text-gray-400 mt-1">{generated.excerpt.length}/160 characters</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Content (Markdown)</label>
                      <textarea value={generated.content} onChange={e => setGenerated({ ...generated, content: e.target.value })} rows={10}
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-y" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tags</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {generated.tags.map((tag, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center gap-1">
                            #{tag}
                            <button onClick={() => setGenerated({ ...generated, tags: generated.tags.filter((_, j) => j !== i) })}
                              className="hover:text-red-500"><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                      <input placeholder="Add tag and press Enter..." onKeyDown={e => {
                        if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                          e.preventDefault();
                          setGenerated({ ...generated, tags: [...generated.tags, (e.target as HTMLInputElement).value.trim()] });
                          (e.target as HTMLInputElement).value = '';
                        }
                      }} className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                    </div>

                    {/* Schedule Date */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                        <CalendarRange className="w-3.5 h-3.5 inline mr-1" /> Schedule Publish (optional)
                      </label>
                      <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                      <p className="text-[10px] text-gray-400 mt-1">Leave empty to publish now or save as draft</p>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                      <button onClick={handleSaveDraft}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        Save Draft
                      </button>
                      {scheduleDate ? (
                        <button onClick={handleSchedule}
                          className="flex-1 py-3 rounded-xl text-white text-sm font-semibold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20">
                          <CalendarRange className="w-4 h-4" /> Schedule
                        </button>
                      ) : (
                        <button onClick={handlePublish}
                          className="flex-1 py-3 rounded-xl text-white text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20">
                          <Send className="w-4 h-4" /> Publish Now
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blog Reader Modal (Article View) */}
      <AnimatePresence>
        {showReader && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto"
            onClick={() => setShowReader(null)}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 w-full max-w-4xl my-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden mx-4">
            {/* Article Content */}
            <div className="p-8">
              {/* Title & Meta */}
              <div className="mb-8">
                {/* Status + Category Badges */}
                <div className="flex items-center gap-2 mb-4">
                  {showReader.category && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                      {showReader.category}
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                    showReader.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}>{showReader.status}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">{showReader.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  {showReader.publishedAt && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {new Date(showReader.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {Math.max(1, Math.ceil((showReader.content || '').split(' ').length / 200))} min read
                  </span>
                  {showReader.category && (
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4" />{showReader.category}
                    </span>
                  )}
                </div>
              </div>

              {/* Excerpt */}
              {showReader.excerpt && (
                <div className="mb-8 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border-l-4 border-purple-500">
                  <p className="text-sm text-purple-800 dark:text-purple-200 italic leading-relaxed">{showReader.excerpt}</p>
                </div>
              )}

              {/* Featured image (published + queued previews both show real photos) */}
              {showReader.featuredImage && (
                <div className="mb-8 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                  <img src={showReader.featuredImage} alt={showReader.title} className="w-full h-64 md:h-80 object-cover" />
                </div>
              )}

              {/* Body */}
              {(showReader.isSchedule || !showReader.content) ? (
                <div className="rounded-2xl border-2 border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10 p-8 md:p-10 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <CalendarRange className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Your article is being prepared</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                    The full 3000-word blog with headings, FAQs and a premium featured image will appear here automatically within minutes — no action needed.
                  </p>
                </div>
              ) : (
                <div className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(showReader.content || '') }} />
              )}

              {/* Tags */}
              {showReader.tags && Array.isArray(showReader.tags) && (
                <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
                  {showReader.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <button onClick={() => setShowReader(null)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to articles
                </button>
                <div className="flex items-center gap-2">
                  {showReader.status === 'draft' && (
                    <button onClick={() => { handleUpdateStatus(showReader.id, 'published'); setShowReader(null); }}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-2">
                      <Send className="w-3.5 h-3.5" /> Publish
                    </button>
                  )}
                  {!showReader.isSchedule && (
                    <button onClick={() => handleRegenerate(showReader.id)}
                      disabled={regenerating === showReader.id}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-purple-600 border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors flex items-center gap-2">
                      <RefreshCw className={`w-3.5 h-3.5 ${regenerating === showReader.id ? 'animate-spin' : ''}`} /> Regenerate
                    </button>
                  )}
                  <button onClick={() => { handleDelete(showReader.id); setShowReader(null); }}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-red-600 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Publish to Website Modal */}
      <AnimatePresence>
        {showEmbed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 pt-16 sm:pt-4"
            onClick={() => setShowEmbed(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto border border-gray-200 dark:border-gray-800"
              onClick={e => e.stopPropagation()}>
              <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Publish to Your Website</h2>
                      <p className="text-xs text-gray-500">Works on WordPress, Shopify, React, HTML, Wix & more</p>
                    </div>
                  </div>
                  <button onClick={() => setShowEmbed(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                {/* HOW IT WORKS - 3 Steps */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-5 border border-emerald-200 dark:border-emerald-800">
                  <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-200 mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4" /> 3 Simple Steps — Done in 30 Seconds!
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-2 text-lg font-bold">1</div>
                      <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">Copy Code</p>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1">Click the copy button</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-2 text-lg font-bold">2</div>
                      <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">Paste in Website</p>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1">Any page, any platform</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-2 text-lg font-bold">3</div>
                      <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">Blogs Go Live!</p>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1">Auto-updates daily</p>
                    </div>
                  </div>
                </div>

                {/* MAIN: Copy & Paste Code — Highlighted */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-5 border-2 border-purple-300 dark:border-purple-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                      <Code className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white">Copy This Code & Paste in Your Website</h3>
                      <p className="text-[10px] text-gray-500">Works on WordPress, Shopify, Wix, Squarespace, HTML — ANY platform!</p>
                    </div>
                  </div>
                  {/* Live customization — the snippet below updates as you pick */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-500 font-medium">Layout:</span>
                      {(['grid', 'list'] as const).map(s => (
                        <button key={s} onClick={() => setEmbedStyle(s)}
                          className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-colors ${embedStyle === s ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-500 font-medium">Show:</span>
                      {[3, 6, 9].map(n => (
                        <button key={n} onClick={() => setEmbedLimit(n)}
                          className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${embedLimit === n ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-500 font-medium">Color:</span>
                      <button onClick={() => setEmbedColor('')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${!embedColor ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                        Auto
                      </button>
                      {['#7c3aed', '#2563eb', '#059669', '#ea580c', '#d46f48'].map(c => (
                        <button key={c} onClick={() => setEmbedColor(c)} title={c}
                          className={`w-6 h-6 rounded-full border-2 transition-transform ${embedColor === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`}
                          style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                  <div className="relative mt-3">
                    <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto font-mono leading-relaxed">
                      {embedSnippet}
                    </pre>
                    <button onClick={() => handleCopyCode(embedSnippet, 'embed')}
                      className="absolute top-2 right-2 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors flex items-center gap-1.5 text-white text-xs font-medium">
                      {copiedCode === 'embed' ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Code</>}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <p className="text-[10px] text-gray-500">No technical knowledge needed — if you can copy-paste, you can do this!</p>
                  </div>
                </div>

                {/* Platform picker — simple steps for non-developers */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-1">Which website builder do you use?</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
                    Pick your platform and follow the 3 easy steps. Even if you paste in the wrong spot, the widget automatically finds its own place on your page.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Object.keys(platformSteps).map(p => (
                      <button key={p} onClick={() => setEmbedPlatform(p)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${embedPlatform === p ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-purple-400'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <ol className="text-xs text-blue-900 dark:text-blue-200 space-y-2 list-decimal list-inside font-medium">
                      {platformSteps[embedPlatform].map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                  </div>
                </div>

                {/* Auto Theme Matching — Highlight */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                  <h4 className="font-bold text-xs text-amber-900 dark:text-amber-200 mb-2 flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5" /> Auto Theme Matching — Blogs Match Your Website Colors!
                  </h4>
                  <p className="text-[10px] text-amber-800 dark:text-amber-300 mb-3">
                    Widget automatically detects your website{"'"}s primary color and adjusts blog card colors to match perfectly. No manual setup needed!
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-2 border border-amber-200 dark:border-amber-700">
                      <code className="text-amber-700 dark:text-amber-400 text-[10px]">{'data-color="#ff6b35"'}</code>
                      <p className="text-gray-500 mt-1 text-[10px]">Force specific color</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-2 border border-amber-200 dark:border-amber-700">
                      <code className="text-amber-700 dark:text-amber-400 text-[10px]">{'data-theme="dark"'}</code>
                      <p className="text-gray-500 mt-1 text-[10px]">Force dark mode</p>
                    </div>
                  </div>
                </div>

                {/* Auto design matching */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-xs text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" /> Matches Your Website Automatically
                  </h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    The widget reads your website's own fonts, colors and card style, so your blog section looks like it was always part of your site. Articles open on YOUR website — readers never leave your domain, and Google counts every article for your ranking.
                  </p>
                </div>

                {/* Advanced Options */}
                <details className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                  <summary className="p-4 cursor-pointer font-semibold text-xs text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5" /> Advanced Options (For Developers)
                  </summary>
                  <div className="px-4 pb-4 space-y-4">
                    <div>
                      <h4 className="font-semibold text-xs text-gray-700 dark:text-gray-300 mb-2">REST API</h4>
                      <div className="relative">
                        <pre className="bg-gray-900 text-green-400 rounded-lg p-3 text-[10px] overflow-x-auto font-mono">
{`fetch('${baseUrl}/api/blog-embed?limit=10')
  .then(r => r.json())
  .then(data => console.log(data.posts))`}
                        </pre>
                        <button onClick={() => handleCopyCode(`fetch('${baseUrl}/api/blog-embed?limit=10')\n  .then(r => r.json())\n  .then(data => console.log(data.posts))`, 'api')}
                          className="absolute top-1.5 right-1.5 p-1.5 rounded bg-gray-700 hover:bg-gray-600 transition-colors">
                          {copiedCode === 'api' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-300" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-gray-700 dark:text-gray-300 mb-2">RSS Feed</h4>
                      <div className="relative">
                        <pre className="bg-gray-900 text-green-400 rounded-lg p-3 text-[10px] overflow-x-auto font-mono">
{`${baseUrl}/api/blog-rss`}
                        </pre>
                        <button onClick={() => handleCopyCode(`${baseUrl}/api/blog-rss`, 'rss')}
                          className="absolute top-1.5 right-1.5 p-1.5 rounded bg-gray-700 hover:bg-gray-600 transition-colors">
                          {copiedCode === 'rss' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-300" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-gray-700 dark:text-gray-300 mb-2">XML Sitemap</h4>
                      <div className="relative">
                        <pre className="bg-gray-900 text-green-400 rounded-lg p-3 text-[10px] overflow-x-auto font-mono">
{`${baseUrl}/api/blog-sitemap`}
                        </pre>
                        <button onClick={() => handleCopyCode(`${baseUrl}/api/blog-sitemap`, 'sitemap')}
                          className="absolute top-1.5 right-1.5 p-1.5 rounded bg-gray-700 hover:bg-gray-600 transition-colors">
                          {copiedCode === 'sitemap' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-300" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </details>

                {/* SEO Benefits */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                  <h3 className="font-bold text-xs text-purple-900 dark:text-purple-200 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> What You Get — Zero Effort!
                  </h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="flex items-start gap-1.5 text-[10px] text-purple-700 dark:text-purple-300"><Check className="w-3 h-3 mt-0.5 flex-shrink-0 text-purple-500" /> Google Rich Snippets (Schema.org)</div>
                    <div className="flex items-start gap-1.5 text-[10px] text-purple-700 dark:text-purple-300"><Check className="w-3 h-3 mt-0.5 flex-shrink-0 text-purple-500" /> Social Media Sharing Cards</div>
                    <div className="flex items-start gap-1.5 text-[10px] text-purple-700 dark:text-purple-300"><Check className="w-3 h-3 mt-0.5 flex-shrink-0 text-purple-500" /> Auto Keywords & Hashtags</div>
                    <div className="flex items-start gap-1.5 text-[10px] text-purple-700 dark:text-purple-300"><Check className="w-3 h-3 mt-0.5 flex-shrink-0 text-purple-500" /> Mobile Responsive Design</div>
                    <div className="flex items-start gap-1.5 text-[10px] text-purple-700 dark:text-purple-300"><Check className="w-3 h-3 mt-0.5 flex-shrink-0 text-purple-500" /> Daily Auto-Updated Content</div>
                    <div className="flex items-start gap-1.5 text-[10px] text-purple-700 dark:text-purple-300"><Check className="w-3 h-3 mt-0.5 flex-shrink-0 text-purple-500" /> Traffic Back to Your Website</div>
                    <div className="flex items-start gap-1.5 text-[10px] text-purple-700 dark:text-purple-300"><Check className="w-3 h-3 mt-0.5 flex-shrink-0 text-purple-500" /> Auto Theme Color Matching</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
