'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { isAdmin } from '@/lib/admin';
import BlogCalendar from '@/components/blog/BlogCalendar';
import {
  X, FileText, Eye, Calendar, Star, Wand2, Search, Clock, Trash2, Edit3, CheckCircle, Send, ArrowLeft, Layers, ExternalLink, Store, Network, CalendarRange, TrendingUp, Shield, Workflow, Code, Copy, Check, Map, Palette, RefreshCw, BarChart3, Share2, Target, Award, Link2, Loader2, AlertCircle, ArrowRight, ChevronDown, Radar, PlugZap, Unplug, CircleDashed, CalendarDays, LayoutGrid } from 'lucide-react';

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
interface ConnectedWebsite {
  id: string; url: string; name: string | null; description: string | null;
  techStack: string | null; niche: string | null; publishMethod: string;
  isActive: boolean; widgetIntegrated: boolean; widgetIntegratedAt: string | null;
  connectionStatus: 'pending' | 'connected' | 'disconnected';
  widgetLastSeenAt: string | null; widgetLastSeenUrl: string | null;
  lastCheckedAt: string | null; lastCheckResult: 'code_found' | 'code_missing' | 'site_unreachable' | null;
  createdAt: string;
  totalBlogs: number; publishedBlogs: number; pendingBlogs: number;
  subscription: { blogsPerMonth: number; blogsUsed: number; blogsRemaining: number; currentPeriodEnd: string; } | null;
  company?: { name: string | null; id: string } | null;
}

const tones = ['Professional', 'Casual', 'Authoritative', 'Friendly', 'Technical', 'Conversational'];
const industries = ['Technology', 'Healthcare', 'Finance', 'E-commerce', 'Education', 'Real Estate', 'Marketing', 'Manufacturing', 'SaaS', 'General Business'];
const lengths = [
  { value: 'short', label: 'Short (400-500 words)' },
  { value: 'medium', label: 'Medium (700-900 words)' },
  { value: 'long', label: 'Long (1200-1500 words)' },
  { value: 'extra-long', label: 'Extra Long (2800-3200 words)' }
];

// Friendly, non-developer step-by-step guides per platform — one tag in <head>, like Google Analytics
const platformSteps: Record<string, string[]> = {
  'WordPress': [
    'Easiest: install a free “Insert Headers and Footers” (or WPCode) plugin.',
    'Paste the tag into the “Header” box and Save.',
    'Or edit header.php and add it right after the opening <head> tag.',
  ],
  'Shopify': [
    'Go to Online Store → Themes → ⋯ → Edit code.',
    'Open layout/theme.liquid and paste the tag just before </head>.',
    'Save — your blog section appears automatically.',
  ],
  'Wix': [
    'In the Wix editor open: Settings → Head Code.',
    'Paste the tag, click Apply, then Publish your site.',
  ],
  'Squarespace': [
    'Go to Settings → Advanced → Code Injection.',
    'Paste the tag in the Header box and Save.',
  ],
  'Google Tag Manager': [
    'In your GTM workspace, click Tags → New → “Custom HTML”.',
    'Paste the tag, tick “Support document.write”, and set the trigger to All Pages.',
    'Publish the container — AINOS detects the connection automatically.',
  ],
  'Webflow': [
    'Open Project Settings → Custom Code → “Inside <head> tags”.',
    'Paste the tag, Save, then Publish your site.',
  ],
  'Other / Custom HTML': [
    'Open the pages you want blogs on (site-wide is best).',
    'Paste the tag right before the closing </head> (or </body>) tag.',
    'Save or publish — the widget finds its own place, no <div> needed.',
  ],
};

// Server-side rewrite rules — only needed for the advanced “Clean URL” mode.
// Each rule tells the host to serve the page holding the widget for /blog/* URLs,
// so the widget can read the article address from the browser’s path.
const rewriteRules: Record<string, { label: string; note: string; code: string }> = {
  Vercel: {
    label: 'Vercel',
    note: 'Add this as a file called vercel.json in your project’s main folder.',
    code: `{\n  "rewrites": [\n    { "source": "/blog/:slug*", "destination": "/index.html" }\n  ]\n}`,
  },
  Netlify: {
    label: 'Netlify',
    note: 'Add this line to a file called _redirects in your site’s main folder.',
    code: `/blog/*  /index.html  200`,
  },
  nginx: {
    label: 'nginx',
    note: 'Add this block inside the server { } area of your nginx config.',
    code: `location /blog/ {\n  try_files $uri $uri/ /index.html;\n}`,
  },
  Apache: {
    label: 'Apache / cPanel',
    note: 'Add these lines near the top of your .htaccess file.',
    code: `RewriteEngine On\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteRule ^blog/([^/]+)/?$ /index.html [L]`,
  },
};

// Simple markdown to HTML converter — strips ALL inline images (only featured image on card)
function renderMarkdown(md: string): string {
  return md
    // Remove ALL markdown images: ![alt](url)
    .replace(/!\[[^\]]*\]\([^)]+\)\n?/g, '')
    // Remove ALL HTML img tags
    .replace(/<img[^>]*>\n?/gi, '')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-purple-600 underline">$1</a>')
    // Headings (H4 first to avoid conflicts)
    .replace(/^#### (.*$)/gm, '<h4 class="text-base font-bold mt-5 mb-2 text-gray-900">$1</h4>')
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-6 mb-2 text-gray-900">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-8 mb-3 text-gray-900">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-8 mb-4 text-gray-900">$1</h1>')
    // Bold & italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^- (.*$)/gm, '<li class="ml-4 mb-1 text-gray-700">• $1</li>')
    // Paragraphs
    .replace(/^(?!<)(.*$)/gm, '<p class="mb-3 text-gray-700 leading-relaxed">$1</p>')
    .replace(/<p class="mb-3.*?><\/p>/g, '');
}

// "5 min ago" style relative time for connection status
function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// Honest connection status shown on each website card
function connectionView(w: ConnectedWebsite) {
  if (w.connectionStatus === 'connected') {
    return {
      label: 'Live on your site', icon: PlugZap, pill: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500',
      detail: w.widgetLastSeenAt ? `Blog widget last seen ${timeAgo(w.widgetLastSeenAt)}` : `Embed code found ${timeAgo(w.lastCheckedAt)}`,
    };
  }
  if (w.connectionStatus === 'disconnected') {
    return {
      label: 'Connection lost', icon: Unplug, pill: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500',
      detail: w.lastCheckResult === 'site_unreachable'
        ? 'AINOS could not reach your website. Check that it is online.'
        : 'The AINOS blog code is no longer on your website. Paste it again to bring your blogs back.',
    };
  }
  return {
    label: 'Not connected yet', icon: CircleDashed, pill: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500',
    detail: w.lastCheckResult === 'site_unreachable'
      ? 'AINOS could not reach your website yet.'
      : 'Paste the embed code on your website so visitors can read your blogs.',
  };
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
  const [siteView, setSiteView] = useState<'cards' | 'calendar'>('cards');
  const [scheduleDate, setScheduleDate] = useState('');
  const [showEmbed, setShowEmbed] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');
  const [embedPlatform, setEmbedPlatform] = useState('WordPress');
  const [embedStyle, setEmbedStyle] = useState<'grid' | 'list'>('grid');
  const [embedLimit, setEmbedLimit] = useState(6);
  const [embedColor, setEmbedColor] = useState('');
  // 'hash' = works everywhere, no setup. 'path' = clean URL, needs a server rule.
  const [embedRouting, setEmbedRouting] = useState<'hash' | 'path'>('hash');
  const [rewritePlatform, setRewritePlatform] = useState('Vercel');
  const [platformMode, setPlatformMode] = useState(false);
  // Which website the modal was opened for (drives the live Verify step)
  const [embedWebsiteId, setEmbedWebsiteId] = useState<string | null>(null);
  // 'auto' = one tag, widget mounts a section itself (GA-style). 'manual' = script + <div>.
  const [embedPlacement, setEmbedPlacement] = useState<'auto' | 'manual'>('auto');

  // ── Unified tab: 'blogs' | 'websites' ──
  const [activeTab, setActiveTab] = useState<'blogs' | 'websites'>('blogs');

  // ── Blog Agent (Connected Websites) state ──
  const [websites, setWebsites] = useState<ConnectedWebsite[]>([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [connectUrl, setConnectUrl] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const autoChecked = useRef<Set<string>>(new Set());

  // ── Website blogs (expandable) ──
  const [expandedWebsiteId, setExpandedWebsiteId] = useState<string | null>(null);
  const [websiteBlogs, setWebsiteBlogs] = useState<Record<string, BlogPost[]>>({});
  const [websiteBlogsLoading, setWebsiteBlogsLoading] = useState(false);

  const fetchWebsiteBlogs = useCallback(async (websiteId: string) => {
    setWebsiteBlogsLoading(true);
    try {
      const res = await fetch(`/api/blog-posts?websiteId=${websiteId}`);
      if (res.ok) {
        const data = await res.json();
        setWebsiteBlogs(prev => ({ ...prev, [websiteId]: data.posts || [] }));
      }
    } catch (e) { console.error(e); }
    setWebsiteBlogsLoading(false);
  }, []);

  const toggleExpandWebsite = (websiteId: string) => {
    if (expandedWebsiteId === websiteId) {
      setExpandedWebsiteId(null);
    } else {
      setExpandedWebsiteId(websiteId);
      if (!websiteBlogs[websiteId]) {
        fetchWebsiteBlogs(websiteId);
      }
    }
  };

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

  // Live embed snippet — 'auto' is a single head tag (like GA); 'manual' keeps the script + div.
  const embedTag = `<script async src="${baseUrl}/embed.js"></script>`;
  const embedSnippetManual = `<script src="${baseUrl}/embed.js"></script>\n<div id="ainos-blog" data-limit="${embedLimit}" data-style="${embedStyle}"${embedColor ? ` data-color="${embedColor}"` : ''}${embedRouting === 'path' ? ' data-routing="path"' : ''}></div>`;
  const embedSnippet = embedPlacement === 'auto' ? embedTag : embedSnippetManual;

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

  // ── Blog Agent: Connected Websites ──
  const fetchWebsites = useCallback(async () => {
    setSitesLoading(true);
    try {
      const params = platformMode && isAdminUser ? '?platform=true' : '';
      const res = await fetch(`/api/blog-agent/websites${params}`);
      if (res.ok) {
        const data = await res.json();
        setWebsites(data.websites || []);
      }
    } catch (e) { console.error(e); }
    setSitesLoading(false);
  }, [platformMode, isAdminUser]);

  useEffect(() => { fetchWebsites(); }, [fetchWebsites]);

  // Live check of the client's site for the embed code; merges the fresh
  // status into the card without reloading the list
  const handleCheckConnection = useCallback(async (websiteId: string) => {
    setCheckingId(websiteId);
    try {
      const res = await fetch('/api/blog-agent/verify-connection', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId }),
      });
      if (res.ok) {
        const fresh = await res.json();
        setWebsites(prev => prev.map(w => w.id === websiteId
          ? { ...w, ...fresh, widgetIntegrated: w.widgetIntegrated || fresh.connectionStatus === 'connected' }
          : w));
      }
    } catch (e) { console.error(e); }
    setCheckingId(null);
  }, []);

  // Re-check sites that haven't been checked in the last 6 hours (once per visit)
  useEffect(() => {
    if (platformMode) return;
    const stale = websites.filter(w => w.isActive && !autoChecked.current.has(w.id)
      && (!w.lastCheckedAt || Date.now() - new Date(w.lastCheckedAt).getTime() > 6 * 60 * 60 * 1000));
    stale.forEach(w => { autoChecked.current.add(w.id); handleCheckConnection(w.id); });
  }, [websites, handleCheckConnection, platformMode]);

  const handleConnectWebsite = async () => {
    if (!connectUrl.trim()) return;
    setConnecting(true); setConnectError('');
    try {
      const res = await fetch('/api/blog-agent/connect-website', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: connectUrl.trim(), publishMethod: 'ainos' }),
      });
      const data = await res.json();
      if (res.ok) { setShowConnect(false); setConnectUrl(''); fetchWebsites(); }
      else setConnectError(data.error || 'Failed to connect website');
    } catch (e) { setConnectError('Network error. Please try again.'); }
    setConnecting(false);
  };

  const handleSchedule30 = async (websiteId: string) => {
    setSchedulingId(websiteId);
    try {
      const res = await fetch('/api/blog-agent/schedule', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId, count: 30 }),
      });
      if (res.ok) fetchWebsites();
    } catch (e) { console.error(e); }
    setSchedulingId(null);
  };

  const handleDisconnectWebsite = async (websiteId: string) => {
    if (!confirm('Disconnect this website? All pending blogs will be cancelled.')) return;
    setDisconnectingId(websiteId);
    try {
      const res = await fetch(`/api/blog-agent/websites?id=${websiteId}`, { method: 'DELETE' });
      if (res.ok) fetchWebsites();
    } catch (e) { console.error(e); }
    setDisconnectingId(null);
  };

  const totalSiteBlogs = websites.reduce((s, w) => s + w.totalBlogs, 0);
  const totalSitePublished = websites.reduce((s, w) => s + w.publishedBlogs, 0);
  const totalSitePending = websites.reduce((s, w) => s + w.pendingBlogs, 0);

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
      if (res.ok) {
        fetchPosts();
        if (expandedWebsiteId) fetchWebsiteBlogs(expandedWebsiteId);
      }
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
      if (res.ok) {
        fetchPosts();
        if (expandedWebsiteId) fetchWebsiteBlogs(expandedWebsiteId);
        setShowReader(null);
      }
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
        if (expandedWebsiteId) fetchWebsiteBlogs(expandedWebsiteId);
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

  return (
    <div className="h-full overflow-auto bg-gray-50">
      {/* ═══════════ TOP ACTION BAR ═══════════ */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-6 md:px-10 bg-white border-b border-gray-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-100 ring-1 ring-violet-200 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ainos-alpha.png" alt="AINOS" className="w-5 h-5 object-contain" />
          </div>
          <span className="text-sm font-bold text-slate-900 whitespace-nowrap">Blogs &amp; Content</span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wider">AUTOPILOT</span>
          {isAdminUser && (
            <div className="ml-3 flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200">
              <button onClick={() => setPlatformMode(false)}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  !platformMode ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}>
                My Blogs
              </button>
              <button onClick={() => setPlatformMode(true)}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                  platformMode ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}>
                <Layers className="w-3 h-3" /> Platform
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'blogs' ? (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => { setShowAI(true); setGenerated(null); }}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-white whitespace-nowrap bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md shadow-purple-500/20 transition-all">
              <Wand2 className="w-3.5 h-3.5" /> Generate with AI
            </motion.button>
          ) : (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setShowConnect(true)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-white whitespace-nowrap bg-[#5b21b6] hover:bg-[#4c1d95] shadow-md shadow-purple-500/20 transition-all">
              <Link2 className="w-3.5 h-3.5" /> Connect Website
            </motion.button>
          )}
        </div>
      </div>

      {/* ═══════════ HERO BANNER ═══════════ */}
      <div className="relative bg-gradient-to-br from-[#1a1040] via-[#2d1b69] to-[#3b1f8e] overflow-hidden">
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
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight leading-[1.2]">
                  Your Content Engine<br />
                  on Full <span className="text-purple-400">Autopilot</span>
                </h1>
                <p className="text-sm text-white/60 max-w-md leading-relaxed">
                  AINOS writes blog posts for your business and publishes them to your website automatically.
                </p>
              </motion.div>
            </div>

          </div>
        </div>
      </div>

      {/* ═══════════ STATS CARDS (overlap hero) ═══════════ */}
      <div className="px-4 sm:px-6 md:px-10 max-w-[1400px] mx-auto -mt-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4"
        >
          {[
            { label: 'Connected Sites', value: websites.length, sub: 'Active Websites', icon: Store, iconBg: 'bg-purple-100', iconColor: 'text-purple-600', subColor: 'text-purple-500' },
            { label: 'Blogs Planned', value: totalSiteBlogs, sub: 'On your calendar', icon: FileText, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', subColor: 'text-blue-500' },
            { label: 'Blogs Written', value: totalSitePublished, sub: 'Ready or live', icon: CheckCircle, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', subColor: 'text-emerald-500' },
            { label: 'In Queue', value: totalSitePending, sub: 'Pending', icon: Clock, iconBg: 'bg-orange-100', iconColor: 'text-orange-600', subColor: 'text-orange-500' },
            { label: 'Total Views', value: totalViews, sub: 'All Time', icon: Eye, iconBg: 'bg-pink-100', iconColor: 'text-pink-600', subColor: 'text-pink-500' },
          ].map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.08 }}
              className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <s.icon className={`w-5 h-5 ${s.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">{s.label}</p>
                  <p className="text-2xl font-extrabold text-slate-900 leading-tight">{s.value}</p>
                  <p className={`text-[11px] font-medium ${s.subColor}`}>{s.sub}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <div className="px-4 py-4 sm:px-6 md:px-10 max-w-[1400px] mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">How it works</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { n: 1, title: 'Connect your website', desc: 'Add your site URL to get started.' },
              { n: 2, title: 'Paste the embed code', desc: 'Copy a 2-line code into your site. We confirm the moment it goes live.' },
              { n: 3, title: 'AI writes your blogs', desc: 'AINOS creates ready-to-post blogs for your business and puts them on a calendar.' },
              { n: 4, title: 'They publish themselves', desc: 'Each blog goes live on its own date and page — nothing to do on your side.' },
              { n: 5, title: 'We keep watch', desc: 'AINOS re-checks your site daily and alerts you if anything breaks.' },
            ].map((s) => (
              <div key={s.n} className="flex flex-col gap-2">
                <span className="w-8 h-8 rounded-full bg-[#5b21b6] text-white text-sm font-bold flex items-center justify-center">{s.n}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{s.title}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <a href="/marketing/blog/guide" className="inline-flex items-center gap-1 text-xs font-semibold text-[#5b21b6] hover:text-[#4c1d95] transition-colors">
              See the full setup guide <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* ═══════════ CONNECTED WEBSITES ═══════════ */}
      <div className="px-4 py-6 sm:px-6 sm:py-8 md:px-10 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Network className="w-5 h-5 text-purple-600" /> Connected Websites
          </h2>
          {websites.length > 0 && (
            <button onClick={() => setShowConnect(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#5b21b6] hover:bg-[#4c1d95] shadow-md shadow-purple-500/20 transition-all">
              <Link2 className="w-3.5 h-3.5" /> Connect Website
            </button>
          )}
        </div>

        {sitesLoading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading websites...</p>
          </div>
        ) : websites.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <div className="w-16 h-16 rounded-2xl bg-violet-100 ring-1 ring-violet-200 flex items-center justify-center mx-auto mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ainos-alpha.png" alt="AINOS" className="w-8 h-8 object-contain" />
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-1">No websites connected</p>
            <p className="text-sm text-gray-500 mb-6">Connect your website to start auto-generating blogs</p>
            <button onClick={() => setShowConnect(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#5b21b6] hover:bg-[#4c1d95] transition-colors inline-flex items-center gap-2">
              <Link2 className="w-4 h-4" /> Connect Website
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {websites.map((w, i) => {
              const cv = connectionView(w);
              const checking = checkingId === w.id;
              const setup = [
                { label: 'Website added', done: true },
                { label: 'Blogs scheduled', done: w.totalBlogs > 0 },
                { label: 'Embed code detected on your site', done: w.connectionStatus === 'connected' },
              ];
              return (
              <motion.div key={w.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Left: Website info */}
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 border border-purple-100">
                        <ExternalLink className="w-6 h-6 text-purple-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-900 text-sm sm:text-base break-all">{w.name || w.url}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${cv.pill}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cv.dot} ${w.connectionStatus === 'connected' ? 'animate-pulse' : ''}`} /> {cv.label}
                          </span>
                          {platformMode && w.company?.name && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">{w.company.name}</span>
                          )}
                        </div>
                        <a href={w.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-purple-600 hover:underline flex items-center gap-1 mt-0.5 break-all">
                          {w.url} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                        {w.niche && <p className="text-[11px] text-gray-400 mt-1">Niche: {w.niche}</p>}
                        {/* Mini stats */}
                        <div className="flex items-center gap-4 mt-2">
                          <div className="text-center">
                            <p className="text-lg font-bold text-gray-900">{w.totalBlogs}</p>
                            <p className="text-[10px] text-gray-400">Planned</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-emerald-600">{w.publishedBlogs}</p>
                            <p className="text-[10px] text-gray-400">Written</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-orange-500">{w.pendingBlogs}</p>
                            <p className="text-[10px] text-gray-400">In Queue</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:items-end">
                      <button onClick={() => toggleExpandWebsite(w.id)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-blue-200 px-4 py-2.5 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-50 sm:w-auto">
                        <FileText className="w-3.5 h-3.5" /> {expandedWebsiteId === w.id ? 'Hide Blogs' : 'View Blogs'}
                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedWebsiteId === w.id ? 'rotate-180' : ''}`} />
                      </button>
                      <button onClick={() => { setAiForm({ topic: '', keywords: w.niche || '', tone: 'Professional', length: 'medium', industry: w.niche || 'General Business' }); setShowAI(true); }}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-200 px-4 py-2.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-50 sm:w-auto">
                        <Wand2 className="w-3.5 h-3.5" /> Generate Blog
                      </button>
                      <button onClick={() => handleSchedule30(w.id)} disabled={schedulingId === w.id}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-purple-200 px-4 py-2.5 text-xs font-bold text-purple-700 transition-colors hover:bg-purple-50 disabled:opacity-50 sm:w-auto">
                        {schedulingId === w.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Workflow className="w-3.5 h-3.5" /> Schedule 30 More</>}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDisconnectWebsite(w.id)} disabled={disconnectingId === w.id}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 px-4 py-2.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 sm:w-auto">
                        {disconnectingId === w.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Trash2 className="w-3.5 h-3.5" /> Disconnect</>}
                      </button>
                    </div>
                  </div>

                  {/* Connection health + setup */}
                  <div className={`mt-5 rounded-xl p-4 ${w.connectionStatus === 'connected' ? 'bg-emerald-50/60' : w.connectionStatus === 'disconnected' ? 'bg-rose-50/70' : 'bg-amber-50/70'}`}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                          <cv.icon className={`w-4 h-4 ${w.connectionStatus === 'connected' ? 'text-emerald-600' : w.connectionStatus === 'disconnected' ? 'text-rose-600' : 'text-amber-600'}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{checking ? 'Checking your website...' : cv.label}</p>
                          <p className="text-xs text-gray-600 mt-0.5 break-words">{cv.detail}</p>
                          {w.connectionStatus !== 'connected' && w.publishedBlogs > 0 && (
                            <p className="text-[11px] font-semibold text-purple-700 mt-1">✍️ {w.publishedBlogs} blog{w.publishedBlogs === 1 ? '' : 's'} ready to publish — connect to go live &amp; unlock the rest.</p>
                          )}
                          {w.lastCheckedAt && (
                            <p className="text-[11px] text-gray-400 mt-0.5">Last checked {timeAgo(w.lastCheckedAt)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                        <button onClick={() => { setEmbedWebsiteId(w.id); setShowEmbed(true); }}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors flex items-center gap-1.5">
                          <Code className="w-3.5 h-3.5" /> Get Embed Code
                        </button>
                        <button onClick={() => handleCheckConnection(w.id)} disabled={checking}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-1.5 disabled:opacity-60">
                          {checking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Radar className="w-3.5 h-3.5" />} Check Connection
                        </button>
                      </div>
                    </div>
                    {w.connectionStatus !== 'connected' && (
                      <div className="mt-4 pt-3 border-t border-black/5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {setup.map((s, si) => (
                          <div key={s.label} className="flex items-center gap-2 min-w-0">
                            {s.done ? (
                              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            ) : (
                              <span className="w-4 h-4 rounded-full border-2 border-gray-300 text-[9px] font-bold text-gray-400 flex items-center justify-center flex-shrink-0">{si + 1}</span>
                            )}
                            <span className={`text-xs ${s.done ? 'text-gray-700' : 'text-gray-500'}`}>{s.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expandable Blog List */}
                <AnimatePresence>
                  {expandedWebsiteId === w.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden border-t border-gray-200"
                    >
                      <div className="p-5 sm:p-6">
                        {/* On-your-site preview — how the widget looks to visitors */}
                        {(() => {
                          const live = (websiteBlogs[w.id] || []).filter(b => !b.isSchedule && b.featuredImage).slice(0, 3);
                          if (!live.length) return null;
                          const host = (() => { try { return new URL(w.url.startsWith('http') ? w.url : `https://${w.url}`).host; } catch { return w.url; } })();
                          return (
                            <div className="mb-5">
                              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5" /> How it looks on your website
                              </p>
                              <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 border-b border-gray-200">
                                  <span className="flex gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /><span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /><span className="w-2.5 h-2.5 rounded-full bg-green-400" /></span>
                                  <div className="flex-1 text-center min-w-0"><span className="inline-block text-[11px] text-gray-500 bg-white rounded-md px-3 py-0.5 max-w-full truncate">{host} · Blog</span></div>
                                </div>
                                <div className="bg-white p-4">
                                  <h4 className="text-sm font-bold text-gray-900">Latest from Our Blog</h4>
                                  <p className="text-[11px] text-gray-400 mb-3">Expert insights, tips and industry updates</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {live.map(b => (
                                      <div key={b.id} className="rounded-lg border border-gray-100 overflow-hidden">
                                        <img src={b.featuredImage || ''} alt="" className="w-full h-20 object-cover" />
                                        <div className="p-2">
                                          {b.category && <span className="text-[9px] font-bold text-purple-600 uppercase">{b.category}</span>}
                                          <p className="text-[11px] font-semibold text-gray-900 line-clamp-2 mt-0.5">{b.title}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-purple-600 flex-shrink-0" /> <span className="break-all">Blogs for {w.name || w.url}</span>
                          </h4>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">{(websiteBlogs[w.id] || []).length} blogs</span>
                            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                              {([['cards', 'Cards', LayoutGrid], ['calendar', 'Calendar', CalendarDays]] as const).map(([v, label, Icon]) => (
                                <button key={v} onClick={() => setSiteView(v)}
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors ${siteView === v ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                                  <Icon className="w-3.5 h-3.5" /> {label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {websiteBlogsLoading ? (
                          <div className="text-center py-8">
                            <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-xs text-gray-500">Loading blogs...</p>
                          </div>
                        ) : (websiteBlogs[w.id] || []).length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 rounded-xl">
                            <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No blogs yet. Click Schedule 30 More to generate blogs.</p>
                          </div>
                        ) : siteView === 'calendar' ? (
                          <BlogCalendar posts={websiteBlogs[w.id] || []} onOpen={(post) => setShowReader(post)} />
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(websiteBlogs[w.id] || []).map((post) => (
                              <motion.div key={post.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => setShowReader(post)}
                                className="group cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-gray-50 transition-all hover:border-purple-300 hover:shadow-lg"
                              >
                                {/* Featured Image — always show image or gradient placeholder */}
                                <div className="h-32 overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-600 to-indigo-800">
                                  {post.featuredImage ? (
                                    <img src={post.featuredImage} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <FileText className="w-8 h-8 text-white/30" />
                                    </div>
                                  )}
                                </div>
                                <div className="p-4">
                                  {/* Status */}
                                  <div className="flex items-center justify-between mb-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                                      post.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                                      post.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                                      'bg-violet-100 text-violet-700'
                                    }`}>{post.status}</span>
                                    {post.category && (
                                      <span className="text-[10px] font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                                        {post.category}
                                      </span>
                                    )}
                                  </div>
                                  {/* Title */}
                                  <h5 className="mb-2 line-clamp-2 text-sm font-semibold text-gray-900 transition-colors group-hover:text-purple-600">
                                    {post.title}
                                  </h5>
                                  {/* Excerpt */}
                                  {post.excerpt && (
                                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>
                                  )}
                                  {/* Tags */}
                                  {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-3">
                                      {post.tags.slice(0, 3).map((tag, j) => (
                                        <span key={j} className="px-1.5 py-0.5 rounded text-[9px] bg-purple-50 text-purple-600 font-medium">
                                          #{tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {/* Meta + Actions */}
                                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                      {post.publishedAt && (
                                        <span className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {post.status === 'published' && (
                                        <a href={`/blog/${post.slug}/`} target="_blank" rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="p-1.5 rounded-lg hover:bg-blue-50" title="View Public Post">
                                          <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                                        </a>
                                      )}
                                      {post.status === 'draft' && (
                                        <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(post.id, 'published'); }}
                                          className="p-1.5 rounded-lg hover:bg-emerald-50" title="Publish">
                                          <Send className="w-3.5 h-3.5 text-emerald-500" />
                                        </button>
                                      )}
                                      <button onClick={(e) => { e.stopPropagation(); handleRegenerate(post.id); }}
                                        disabled={regenerating === post.id}
                                        className="p-1.5 rounded-lg hover:bg-purple-50" title="Regenerate with AI">
                                        <RefreshCw className={`w-3.5 h-3.5 text-purple-500 ${regenerating === post.id ? 'animate-spin' : ''}`} />
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                                        className="p-1.5 rounded-lg hover:bg-red-50" title="Delete">
                                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              );
            })}
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
              className="bg-white rounded-2xl w-full max-w-3xl border border-gray-200 shadow-2xl max-h-[90vh] overflow-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <Wand2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">AI Blog Agent</h2>
                      <p className="text-xs text-gray-500">Research, write & publish SEO-optimized content</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAI(false)} disabled={generating}
                    className="rounded-xl p-2 transition-colors hover:bg-gray-100 disabled:opacity-50">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {!generated ? (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Blog Topic *</label>
                      <input value={aiForm.topic} onChange={e => setAiForm({ ...aiForm, topic: e.target.value })}
                        placeholder="e.g., How AI is Transforming Small Business Operations in 2025"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">SEO Keywords</label>
                      <input value={aiForm.keywords} onChange={e => setAiForm({ ...aiForm, keywords: e.target.value })}
                        placeholder="e.g., AI for business, small business automation, business tools"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tone</label>
                        <select value={aiForm.tone} onChange={e => setAiForm({ ...aiForm, tone: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500">
                          {tones.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Length</label>
                        <select value={aiForm.length} onChange={e => setAiForm({ ...aiForm, length: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500">
                          {lengths.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Industry</label>
                        <select value={aiForm.industry} onChange={e => setAiForm({ ...aiForm, industry: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500">
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
                          <Star className="w-4 h-4" /> Generate SEO Blog Post
                        </>
                      )}
                    </button>

                    {generating && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-100">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                          <p className="text-sm font-semibold text-purple-700">AI Blog Agent is working...</p>
                        </div>
                        <div className="space-y-1.5 text-xs text-purple-600/70">
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
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <p className="text-sm font-semibold text-emerald-700">Blog post generated successfully!</p>
                      </div>
                      <p className="text-xs text-emerald-600/70">Review and edit below, then publish or save as draft</p>
                    </div>

                    {/* SEO Score */}
                    {generated.seoScore && (
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-semibold text-gray-900">SEO / AEO Score</span>
                          </div>
                          <span className={`text-2xl font-bold ${
                            generated.seoScore >= 80 ? 'text-emerald-600' : generated.seoScore >= 60 ? 'text-amber-600' : 'text-red-600'
                          }`}>{generated.seoScore}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
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
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Featured Image</label>
                        <div className="relative rounded-xl overflow-hidden border border-gray-200">
                          <img src={generated.featuredImage} alt="Generated" className="w-full aspect-[16/9] object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Title</label>
                      <input value={generated.title} onChange={e => setGenerated({ ...generated, title: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Slug</label>
                        <input value={generated.slug} onChange={e => setGenerated({ ...generated, slug: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-500 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category</label>
                        <input value={generated.category || ''} onChange={e => setGenerated({ ...generated, category: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Meta Description (SEO)</label>
                      <textarea value={generated.excerpt} onChange={e => setGenerated({ ...generated, excerpt: e.target.value })} rows={2}
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none" />
                      <p className="text-[10px] text-gray-400 mt-1">{generated.excerpt.length}/160 characters</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Content (Markdown)</label>
                      <textarea value={generated.content} onChange={e => setGenerated({ ...generated, content: e.target.value })} rows={10}
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-y" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tags</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {generated.tags.map((tag, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-purple-50 text-purple-600 flex items-center gap-1">
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
                      }} className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                    </div>

                    {/* Schedule Date */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        <CalendarRange className="w-3.5 h-3.5 inline mr-1" /> Schedule Publish (optional)
                      </label>
                      <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                      <p className="text-[10px] text-gray-400 mt-1">Leave empty to publish now or save as draft</p>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button onClick={handleSaveDraft}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50:bg-gray-800 transition-colors">
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
              className="bg-white w-full max-w-4xl my-8 rounded-2xl border border-gray-200 shadow-2xl overflow-hidden mx-4">
            {/* Article Content */}
            <div className="p-5 sm:p-8">
              {/* Title & Meta */}
              <div className="mb-8">
                {/* Status + Category Badges */}
                <div className="flex items-center gap-2 mb-4">
                  {showReader.category && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                      {showReader.category}
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                    showReader.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}>{showReader.status}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{showReader.title}</h1>
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
                <div className="mb-8 p-4 bg-purple-50 rounded-xl border-l-4 border-purple-500">
                  <p className="text-sm text-purple-800 italic leading-relaxed">{showReader.excerpt}</p>
                </div>
              )}

              {/* Featured image (published + queued previews both show real photos) */}
              {showReader.featuredImage && (
                <div className="mb-8 rounded-2xl overflow-hidden border border-gray-200">
                  <img src={showReader.featuredImage} alt={showReader.title} className="w-full h-64 md:h-80 object-cover" />
                </div>
              )}

              {/* Body */}
              {(showReader.isSchedule || !showReader.content) ? (
                <div className="rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50/50 p-8 md:p-10 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <CalendarRange className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Scheduled for publication</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                    This article is queued in your publishing calendar and will go live automatically on its scheduled date.
                  </p>
                </div>
              ) : (
                <div className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(showReader.content || '') }} />
              )}

              {/* Tags */}
              {showReader.tags && Array.isArray(showReader.tags) && (
                <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-200">
                  {showReader.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-600 font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <button onClick={() => setShowReader(null)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700:text-gray-300 transition-colors">
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
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-purple-600 border border-purple-200 hover:bg-purple-50:bg-purple-900/20 transition-colors flex items-center gap-2">
                      <RefreshCw className={`w-3.5 h-3.5 ${regenerating === showReader.id ? 'animate-spin' : ''}`} /> Regenerate
                    </button>
                  )}
                  <button onClick={() => { handleDelete(showReader.id); setShowReader(null); }}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50:bg-red-900/20 transition-colors flex items-center gap-2">
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
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto border border-gray-200"
              onClick={e => e.stopPropagation()}>
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <Code className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Connect Your Website</h2>
                      <p className="text-xs text-gray-500">One tag in your &lt;head&gt; — like Google Analytics. WordPress, Shopify, Wix, GTM & more</p>
                    </div>
                  </div>
                  <button onClick={() => setShowEmbed(false)} className="p-2 rounded-lg hover:bg-gray-100:bg-gray-800 transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                {/* HOW IT WORKS - 3 Steps */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200">
                  <h3 className="font-bold text-sm text-emerald-900 mb-4 flex items-center gap-2">
                    <Workflow className="w-4 h-4" /> 3 Simple Steps — Done in 30 Seconds!
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-2 text-lg font-bold">1</div>
                      <p className="text-xs font-semibold text-emerald-900">Copy Code</p>
                      <p className="text-[10px] text-emerald-700 mt-1">Click the copy button</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-2 text-lg font-bold">2</div>
                      <p className="text-xs font-semibold text-emerald-900">Paste in &lt;head&gt;</p>
                      <p className="text-[10px] text-emerald-700 mt-1">One tag, works site-wide</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-2 text-lg font-bold">3</div>
                      <p className="text-xs font-semibold text-emerald-900">Verify &amp; Go Live</p>
                      <p className="text-[10px] text-emerald-700 mt-1">AINOS confirms it’s receiving data</p>
                    </div>
                  </div>
                </div>

                {/* MAIN: One tag — install like Google Analytics */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border-2 border-purple-300">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                      <Code className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">Copy your AINOS tag</h3>
                      <p className="text-[10px] text-gray-500">Like Google Analytics — paste this one tag in your &lt;head&gt; and blogs go live site-wide.</p>
                    </div>
                  </div>

                  {/* placement toggle: auto (one tag) vs manual (script + div) */}
                  <div className="inline-flex rounded-lg bg-white border border-purple-200 p-0.5 mb-3">
                    <button onClick={() => setEmbedPlacement('auto')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${embedPlacement === 'auto' ? 'bg-[#5b21b6] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                      Auto place (recommended)
                    </button>
                    <button onClick={() => setEmbedPlacement('manual')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${embedPlacement === 'manual' ? 'bg-[#5b21b6] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                      I’ll choose the spot
                    </button>
                  </div>

                  {/* Live customization — only relevant for the manual <div> mode */}
                  {embedPlacement === 'manual' && (
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-3 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-500 font-medium">Layout:</span>
                      {(['grid', 'list'] as const).map(s => (
                        <button key={s} onClick={() => setEmbedStyle(s)}
                          className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-colors ${embedStyle === s ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200:bg-gray-700'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-500 font-medium">Show:</span>
                      {[3, 6, 9].map(n => (
                        <button key={n} onClick={() => setEmbedLimit(n)}
                          className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${embedLimit === n ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200:bg-gray-700'}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-500 font-medium">Color:</span>
                      <button onClick={() => setEmbedColor('')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${!embedColor ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200:bg-gray-700'}`}>
                        Auto
                      </button>
                      {['#7c3aed', '#2563eb', '#059669', '#ea580c', '#d46f48'].map(c => (
                        <button key={c} onClick={() => setEmbedColor(c)} title={c}
                          className={`w-6 h-6 rounded-full border-2 transition-transform ${embedColor === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                          style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                  )}

                  <div className="relative">
                    <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap break-all">
                      {embedSnippet}
                    </pre>
                    <button onClick={() => handleCopyCode(embedSnippet, 'embed')}
                      className="absolute top-2 right-2 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors flex items-center gap-1.5 text-white text-xs font-medium">
                      {copiedCode === 'embed' ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy tag</>}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2">
                    {embedPlacement === 'auto'
                      ? 'One line, no <div> needed — the widget creates a “Latest from Our Blog” section on every page automatically.'
                      : 'Paste the script, then drop the <div> exactly where you want blogs to appear. Colors match your site automatically.'}
                  </p>
                </div>

                {/* Platform picker — simple steps for non-developers */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-800 mb-1">Which website builder do you use?</h4>
                  <p className="text-[11px] text-gray-500 mb-3">
                    Pick your platform and follow the 3 easy steps. Even if you paste in the wrong spot, the widget automatically finds its own place on your page.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Object.keys(platformSteps).map(p => (
                      <button key={p} onClick={() => setEmbedPlatform(p)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${embedPlatform === p ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 text-gray-600 hover:border-purple-400'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <ol className="text-xs text-blue-900 space-y-2 list-decimal list-inside font-medium">
                      {platformSteps[embedPlatform].map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                  </div>
                </div>

                {/* Verify connection — like GA's "verify and see data" */}
                {embedWebsiteId && (() => {
                  const w = websites.find(x => x.id === embedWebsiteId);
                  if (!w) return null;
                  const view = connectionView(w);
                  const connected = w.connectionStatus === 'connected';
                  const busy = checkingId === w.id;
                  return (
                    <div className={`rounded-xl p-5 border ${connected ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'}`}>
                      <h4 className="font-bold text-sm text-gray-900 mb-1 flex items-center gap-2">
                        <Radar className="w-4 h-4" /> Verify it’s live
                      </h4>
                      <p className="text-[11px] text-gray-600 mb-3">
                        Paste the tag, then open {w.url} in another tab. We confirm the moment AINOS starts receiving data from your site.
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <button onClick={() => handleCheckConnection(w.id)} disabled={busy}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#5b21b6] hover:bg-[#4c1d95] transition-colors flex items-center gap-1.5 disabled:opacity-60">
                          {busy ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking…</> : <><Radar className="w-3.5 h-3.5" /> Verify connection</>}
                        </button>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${view.pill}`}>
                          {connected ? '✓ Connected — receiving data' : view.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-2">{view.detail}</p>
                    </div>
                  );
                })()}

                {/* Auto Theme Matching — Highlight */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                  <h4 className="font-bold text-xs text-amber-900 mb-2 flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5" /> Auto Theme Matching — Blogs Match Your Website Colors!
                  </h4>
                  <p className="text-[10px] text-amber-800 mb-3">
                    Widget automatically detects your website{"'"}s primary color and adjusts blog card colors to match perfectly. No manual setup needed!
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white rounded-lg p-2 border border-amber-200">
                      <code className="text-amber-700 text-[10px]">{'data-color="#ff6b35"'}</code>
                      <p className="text-gray-500 mt-1 text-[10px]">Force specific color</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-amber-200">
                      <code className="text-amber-700 text-[10px]">{'data-theme="dark"'}</code>
                      <p className="text-gray-500 mt-1 text-[10px]">Force dark mode</p>
                    </div>
                  </div>
                </div>

                {/* Auto design matching */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="font-semibold text-xs text-gray-700 mb-1 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" /> Matches Your Website Automatically
                  </h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    The widget reads your website&apos;s own fonts, colors and card style, so your blog section looks like it was always part of your site. Articles open on YOUR website — readers never leave your domain, and Google counts every article for your ranking.
                  </p>
                </div>

                {/* Advanced Options */}
                <details className="bg-gray-50 rounded-xl border border-gray-200">
                  <summary className="p-4 cursor-pointer font-semibold text-xs text-gray-700 flex items-center gap-2">
                    <Workflow className="w-3.5 h-3.5" /> Advanced Options (For Developers)
                  </summary>
                  <div className="px-4 pb-4 space-y-4">
                    <div>
                      <h4 className="font-semibold text-xs text-gray-700 mb-2">REST API</h4>
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
                      <h4 className="font-semibold text-xs text-gray-700 mb-2">RSS Feed</h4>
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
                      <h4 className="font-semibold text-xs text-gray-700 mb-2">XML Sitemap</h4>
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
                    <div>
                      <h4 className="font-semibold text-xs text-gray-700 mb-2">Article URLs (routing)</h4>
                      <p className="text-[11px] text-gray-500 mb-2 leading-relaxed">
                        By default articles open on a hash route (yourdomain.com/#/blog/slug). This needs no server configuration and works on every host — leave it here unless you know your server already rewrites <code className="text-gray-700">/blog/*</code> to your page.
                      </p>
                      <div className="flex items-center gap-1.5 mb-3">
                        <button onClick={() => setEmbedRouting('hash')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${embedRouting === 'hash' ? 'bg-[#5b21b6] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          Hash (default)
                        </button>
                        <button onClick={() => setEmbedRouting('path')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${embedRouting === 'path' ? 'bg-[#5b21b6] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          Clean URL (data-routing=&quot;path&quot;)
                        </button>
                      </div>
                      {embedRouting === 'path' && (
                        <div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {Object.keys(rewriteRules).map(p => (
                              <button key={p} onClick={() => setRewritePlatform(p)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors ${rewritePlatform === p ? 'bg-[#5b21b6] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                {rewriteRules[p].label}
                              </button>
                            ))}
                          </div>
                          <p className="text-[10px] text-gray-500 mb-1">{rewriteRules[rewritePlatform].note}</p>
                          <div className="relative">
                            <pre className="bg-gray-900 text-green-400 rounded-lg p-3 pr-20 text-[10px] overflow-x-auto font-mono leading-relaxed">
                              {rewriteRules[rewritePlatform].code}
                            </pre>
                            <button onClick={() => handleCopyCode(rewriteRules[rewritePlatform].code, `rewrite-${rewritePlatform}`)}
                              className="absolute top-1.5 right-1.5 p-1.5 rounded bg-gray-700 hover:bg-gray-600 transition-colors">
                              {copiedCode === `rewrite-${rewritePlatform}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-300" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </details>

                {/* SEO Benefits */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                  <h3 className="font-bold text-xs text-purple-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> What You Get — Zero Effort!
                  </h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="flex items-start gap-1.5 text-[10px] text-purple-700"><Check className="w-3 h-3 mt-0.5 flex-shrink-0 text-purple-500" /> Google Rich Snippets (Schema.org)</div>
                    <div className="flex items-start gap-1.5 text-[10px] text-purple-700"><Check className="w-3 h-3 mt-0.5 flex-shrink-0 text-purple-500" /> Social Media Sharing Cards</div>
                    <div className="flex items-start gap-1.5 text-[10px] text-purple-700"><Check className="w-3 h-3 mt-0.5 flex-shrink-0 text-purple-500" /> Auto Keywords & Hashtags</div>
                    <div className="flex items-start gap-1.5 text-[10px] text-purple-700"><Check className="w-3 h-3 mt-0.5 flex-shrink-0 text-purple-500" /> Mobile Responsive Design</div>
                    <div className="flex items-start gap-1.5 text-[10px] text-purple-700"><Check className="w-3 h-3 mt-0.5 flex-shrink-0 text-purple-500" /> Daily Auto-Updated Content</div>
                    <div className="flex items-start gap-1.5 text-[10px] text-purple-700"><Check className="w-3 h-3 mt-0.5 flex-shrink-0 text-purple-500" /> Traffic Back to Your Website</div>
                    <div className="flex items-start gap-1.5 text-[10px] text-purple-700"><Check className="w-3 h-3 mt-0.5 flex-shrink-0 text-purple-500" /> Auto Theme Color Matching</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════ CONNECT WEBSITE MODAL ══════════ */}
      <AnimatePresence>
        {showConnect && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => { setShowConnect(false); setConnectError(''); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg border border-gray-200 shadow-2xl">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <Link2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Connect Your Website</h2>
                      <p className="text-xs text-gray-500">AI will analyze your site & auto-generate blogs</p>
                    </div>
                  </div>
                  <button onClick={() => { setShowConnect(false); setConnectError(''); }}
                    className="p-2 rounded-xl hover:bg-gray-100:bg-gray-800 transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {connectError && (
                  <div className="bg-red-50 rounded-xl p-3 border border-red-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-700">{connectError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Your Website URL</label>
                  <input value={connectUrl} onChange={e => setConnectUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleConnectWebsite()}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                  <p className="text-[10px] text-gray-400 mt-1">We&apos;ll scrape your site, detect your niche &amp; tech stack</p>
                </div>

                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-purple-700 mb-1">What happens next?</p>
                      <ul className="text-[10px] text-purple-600/80 space-y-1">
                        <li>1. AI analyzes your website (niche, brand voice, competitors)</li>
                        <li>2. 30 SEO blog topics are auto-generated for the month</li>
                        <li>3. Blogs are written & published automatically every day</li>
                        <li>4. All content is SEO-optimized with featured images</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button onClick={handleConnectWebsite} disabled={connecting || !connectUrl.trim()}
                  className="w-full py-3 rounded-xl text-white text-sm font-bold bg-[#5b21b6] hover:bg-[#4c1d95] transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                  {connecting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing Website...</>
                  ) : (
                    <><Wand2 className="w-4 h-4" /> Connect & Auto-Generate 30 Blogs</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
