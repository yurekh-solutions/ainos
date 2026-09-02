'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { isAdmin } from '@/lib/admin';
import {
  Globe, Plus, X, Loader2, Sparkles,
  Zap, Link2, Mail, Code, FileText, CheckCircle,
  Clock, ChevronRight, Copy, Check, Bot, Shield, MoreVertical,
  Wand2, Calendar, Trash2
} from 'lucide-react';

interface Website {
  id: string;
  url: string;
  name: string;
  techStack: string;
  niche: string;
  publishMethod: string;
  isActive: boolean;
  subscription: {
    blogsPerMonth: number;
    blogsUsed: number;
    blogsRemaining: number;
    currentPeriodEnd: string;
  } | null;
  totalBlogs: number;
  publishedBlogs: number;
  pendingBlogs: number;
  lastPublishedAt?: string;
  company?: { name: string | null; id: string } | null;
}

interface Schedule {
  id: string;
  topic: string;
  status: string;
  scheduledDate: string;
  blogPost: { id: string; title: string; slug: string; status: string } | null;
}

const techStackLabels: Record<string, string> = {
  nextjs: 'Next.js', react: 'React', wordpress: 'WordPress', shopify: 'Shopify',
  wix: 'Wix', squarespace: 'Squarespace', webflow: 'Webflow', html: 'HTML',
  php: 'PHP', vue: 'Vue', angular: 'Angular', gatsby: 'Gatsby', astro: 'Astro', other: 'Custom',
};

const publishMethodConfig: Record<string, { icon: typeof Globe; label: string; color: string }> = {
  ainos: { icon: FileText, label: 'AINOS Blog', color: 'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800' },
  webhook: { icon: Code, label: 'Webhook', color: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800' },
  wordpress: { icon: Globe, label: 'WordPress', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
  email: { icon: Mail, label: 'Email', color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
  multiple: { icon: Zap, label: 'Multiple', color: 'text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-50 dark:bg-fuchsia-900/20 border-fuchsia-200 dark:border-fuchsia-800' },
};

const statusStyles: Record<string, { dot: string; badge: string }> = {
  published: { dot: 'bg-emerald-500 shadow-emerald-500/50', badge: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  generating: { dot: 'bg-blue-500 shadow-blue-500/50 animate-pulse', badge: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  failed: { dot: 'bg-red-500 shadow-red-500/50', badge: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' },
  pending: { dot: 'bg-gray-300 dark:bg-gray-600', badge: 'bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700' },
};

export default function BlogAgentPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnect, setShowConnect] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<Record<string, unknown> | null>(null);
  const [showAllSites, setShowAllSites] = useState(false);
  const [platformMode, setPlatformMode] = useState(false);

  // Platform-wide view is admin-only (platform owner account)
  const { data: session } = useSession();
  const isAdminUser = isAdmin(session?.user?.email);

  const [form, setForm] = useState({
    url: '', publishMethod: 'ainos', webhookUrl: '', webhookSecret: '',
    wordpressUrl: '', wordpressUsername: '', wordpressAppPassword: '', deliveryEmail: '',
  });

  const platformQuery = platformMode ? '?platform=true' : '';

  useEffect(() => {
    (async () => {
      try {
        const [webRes, schedRes] = await Promise.all([
          fetch(`/api/blog-agent/websites${platformQuery}`),
          fetch('/api/blog-agent/schedule'),
        ]);
        if (webRes.ok) { const d = await webRes.json(); setWebsites(d.websites || []); }
        if (schedRes.ok) { const d = await schedRes.json(); setSchedules(d.schedules || []); }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [platformMode]); // eslint-disable-line

  const refreshData = async () => {
    try {
      const [webRes, schedRes] = await Promise.all([
        fetch(`/api/blog-agent/websites${platformQuery}`),
        fetch('/api/blog-agent/schedule'),
      ]);
      if (webRes.ok) { const d = await webRes.json(); setWebsites(d.websites || []); }
      if (schedRes.ok) { const d = await schedRes.json(); setSchedules(d.schedules || []); }
    } catch (e) { console.error(e); }
  };

  const handleConnect = async () => {
    if (!form.url.trim()) return;
    setConnecting(true);
    setAnalysisResult(null);
    try {
      const res = await fetch('/api/blog-agent/connect-website', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysisResult(data);
        setForm({ url: '', publishMethod: 'ainos', webhookUrl: '', webhookSecret: '', wordpressUrl: '', wordpressUsername: '', wordpressAppPassword: '', deliveryEmail: '' });
        refreshData();
        // The server now auto-generates the queued blogs in the background
        // right after connecting (startBackgroundGeneration in connect-website).
      } else {
        const data = await res.json();
        if (data.supportEmail) {
          // Show support email message for multi-website upgrade
          alert(`${data.error}\n\n${data.supportMessage}\n\nEmail: ${data.supportEmail}`);
        } else {
          alert(data.error || 'Failed to connect website');
        }
      }
    } catch { alert('Failed to connect website'); }
    finally { setConnecting(false); }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm('Disconnect this website? Pending blogs will be cancelled. You can connect again anytime for a fresh start.')) return;
    try { const res = await fetch(`/api/blog-agent/websites?id=${id}`, { method: 'DELETE' }); if (res.ok) refreshData(); } catch { /* ignore */ }
  };

  const handleScheduleMore = async (websiteId: string) => {
    try {
      const res = await fetch('/api/blog-agent/schedule', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ websiteId, count: 30 }),
      });
      if (res.ok) { refreshData(); alert('30 more blogs scheduled!'); }
      else { const d = await res.json(); alert(d.error || 'Failed to schedule'); }
    } catch { /* ignore */ }
  };

  const totalBlogs = websites.reduce((s, w) => s + w.totalBlogs, 0);
  const publishedBlogs = websites.reduce((s, w) => s + w.publishedBlogs, 0);
  const pendingBlogs = schedules.filter(s => s.status === 'pending').length;
  const totalQuota = websites.reduce((s, w) => s + (w.subscription?.blogsPerMonth || 0), 0);
  const usedQuota = websites.reduce((s, w) => s + (w.subscription?.blogsUsed || 0), 0);

  const webhookSnippets: Record<string, string> = {
    'Next.js': `// app/api/webhooks/ainos-blog/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const data = await req.json();
  const { title, content, slug, tags } = data.data;
  // Save to your CMS/database here
  return NextResponse.json({ success: true });
}`,
    'PHP': `<?php
// webhook.php
$data = json_decode(file_get_contents('php://input'), true);
$title = $data['data']['title'];
$content = $data['data']['content'];
// Save to your database here
echo json_encode(['success' => true]);
?>`,
    'Python': `# Flask endpoint
from flask import Flask, request, jsonify
app = Flask(__name__)

@app.route('/webhooks/ainos-blog', methods=['POST'])
def ainos_webhook():
    data = request.json['data']
    # Save to your database here
    return jsonify({'success': True})`,
  };

  const recentActivity = schedules.filter(s => s.status !== 'cancelled').slice(0, 5);

  const statCards = [
    { label: 'Connected Sites', value: websites.length, sub: 'Active Websites', icon: Globe, iconBg: 'bg-purple-100', iconColor: 'text-purple-600', subColor: 'text-purple-500' },
    { label: 'Blogs Generated', value: totalBlogs, sub: 'This Month', icon: FileText, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', subColor: 'text-blue-500' },
    { label: 'Published Live', value: publishedBlogs, sub: 'Live on Site', icon: CheckCircle, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', subColor: 'text-emerald-500' },
    { label: 'In Queue', value: pendingBlogs, sub: 'Pending', icon: Clock, iconBg: 'bg-orange-100', iconColor: 'text-orange-600', subColor: 'text-orange-500' },
  ];

  return (
    <div className="h-full overflow-auto bg-gray-50 dark:bg-gray-950">
      {/* ═══════════ TOP ACTION BAR ═══════════ */}
      <div className="flex items-center justify-between px-6 py-3 md:px-10 bg-white dark:bg-gray-900 border-b border-gray-200/80 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-bold text-slate-900 dark:text-white">AI Blog Agent</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 uppercase tracking-wider">AUTOPILOT</span>
          {/* Platform-wide toggle — admin only */}
          {isAdminUser && (
          <div className="ml-3 flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700">
            <button onClick={() => setPlatformMode(false)}
              className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                !platformMode ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}>
              My Sites
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
            onClick={() => { setShowConnect(true); setAnalysisResult(null); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md shadow-purple-500/20 transition-all">
            <Link2 className="w-3.5 h-3.5" /> Connect Website
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
                  <Wand2 className="w-5 h-5 text-purple-300" />
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight leading-[1.2]">
                  Your Content Engine<br />
                  on Full <span className="text-purple-400">Autopilot</span>
                </h1>
                <p className="text-sm text-white/60 max-w-md leading-relaxed">
                  Connect your website once. Our AI studies your brand, detects your tech stack, and auto-generates 30 SEO-optimized articles every month — published directly to your site.
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
                  <Code className="w-4 h-4 text-white" />
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
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {statCards.map((s, i) => (
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

      {/* ═══════════ BODY ═══════════ */}
      <div className="px-4 py-4 sm:px-6 sm:py-6 md:px-10 max-w-[1400px] mx-auto space-y-6">

        {/* ── Connected Websites ─ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Connected Websites</h2>
            </div>
            <button onClick={() => setShowAllSites(!showAllSites)}
              className="flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 transition-colors">
              {showAllSites ? 'Show Less' : 'View All'} <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="relative w-10 h-10 mx-auto mb-3">
                <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-gray-800" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-600 animate-spin" />
              </div>
              <p className="text-sm text-slate-500">Loading websites...</p>
            </div>
          ) : websites.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6 text-purple-400" />
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white mb-1">No websites connected yet</p>
              <p className="text-sm text-slate-500 mb-5 max-w-sm mx-auto">Connect your first website and let AI start generating SEO-optimized content.</p>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setShowConnect(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/25 transition-all"
              >
                <Plus className="w-4 h-4" /> Connect Your First Website
              </motion.button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {(showAllSites ? websites : websites.slice(0, 3)).map((site) => {
                const pubConfig = publishMethodConfig[site.publishMethod] || publishMethodConfig.ainos;
                const PubIcon = pubConfig.icon;
                return (
                  <div key={site.id} className="flex items-center gap-5 px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    {/* Thumbnail */}
                    <div className="w-[140px] h-[80px] rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
                      <div className="text-center">
                        <Globe className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                        <p className="text-[9px] font-bold text-purple-500 truncate px-2">{new URL(site.url).hostname}</p>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <a href={site.url} target="_blank" rel="noopener noreferrer"
                          className="text-sm font-bold text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors truncate">
                          {site.name || new URL(site.url).hostname}
                        </a>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${
                          site.isActive
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : 'bg-gray-50 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${site.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                          {site.isActive ? 'Connected' : 'Inactive'}
                        </span>
                        {platformMode && site.company?.name && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                            <Globe className="w-2.5 h-2.5" /> {site.company.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-base font-extrabold text-slate-900 dark:text-white">{site.totalBlogs}</p>
                          <p className="text-[10px] text-slate-400">Blogs Generated</p>
                        </div>
                        <div className="text-center">
                          <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{site.publishedBlogs}</p>
                          <p className="text-[10px] text-slate-400">Published</p>
                        </div>
                        <div className="text-center">
                          <p className="text-base font-extrabold text-orange-600 dark:text-orange-400">{site.pendingBlogs}</p>
                          <p className="text-[10px] text-slate-400">In Queue</p>
                        </div>
                        {site.lastPublishedAt && (
                          <div className="text-center">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                              {new Date(site.lastPublishedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Last Published · {new Date(site.lastPublishedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => handleScheduleMore(site.id)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/15 hover:bg-purple-100 dark:hover:bg-purple-900/25 border border-purple-200/50 dark:border-purple-800/50 transition-colors flex items-center gap-1.5">
                        Schedule 30 More <ChevronRight className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDisconnect(site.id)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 transition-colors flex items-center gap-1.5">
                        <Trash2 className="w-3.5 h-3.5" /> Disconnect
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* ── Bottom Panels: Recent Activity + AI Insights ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Blog Activity */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Blog Activity</h2>
              </div>
            </div>
            {recentActivity.length === 0 ? (
              <div className="text-center py-12 px-6">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">No activity yet</p>
                <p className="text-xs text-slate-400">Connect a website to start generating blogs</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {recentActivity.map((s) => {
                  const st = statusStyles[s.status] || statusStyles.pending;
                  return (
                    <div key={s.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <div className={`w-2.5 h-2.5 rounded-full ${st.dot} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{s.topic}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(s.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border flex-shrink-0 ${st.badge}`}>{s.status}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* AI Insights */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">AI Insights</h2>
              </div>
              <select className="text-xs font-medium text-slate-500 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20">
                <option>This Month</option>
                <option>Last Month</option>
                <option>All Time</option>
              </select>
            </div>
            <div className="p-6">
              {websites.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                    <Zap className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">No insights yet</p>
                  <p className="text-xs text-slate-400">Connect a website to see AI-powered insights</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Quota usage */}
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="font-medium text-slate-500">Content Quota Used</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{totalQuota > 0 ? Math.round((usedQuota / totalQuota) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${totalQuota > 0 ? (usedQuota / totalQuota) * 100 : 0}%` }}
                        transition={{ duration: 1 }} className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{usedQuota} of {totalQuota} blogs generated</p>
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-4 border border-purple-100 dark:border-purple-900/30">
                      <p className="text-2xl font-extrabold text-purple-700 dark:text-purple-300">{websites.length}</p>
                      <p className="text-xs font-medium text-purple-600/70 dark:text-purple-400/70">Active Sites</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/30">
                      <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">{publishedBlogs}</p>
                      <p className="text-xs font-medium text-emerald-600/70 dark:text-emerald-400/70">Published</p>
                    </div>
                  </div>

                  {/* AI tip */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/20 rounded-xl p-4 border border-purple-100 dark:border-purple-900/30">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-purple-800 dark:text-purple-200 mb-0.5">AI Recommendation</p>
                        <p className="text-xs text-purple-600/70 dark:text-purple-400/70 leading-relaxed">
                          {pendingBlogs > 0
                            ? `You have ${pendingBlogs} blogs in queue. Consider connecting more sites to maximize your content output.`
                            : 'Great job! All scheduled blogs are published. Connect another website to expand your content reach.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ══════════ CONNECT MODAL ══════════ */}
      <AnimatePresence>
        {showConnect && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => !connecting && setShowConnect(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-2xl border border-gray-200 dark:border-gray-800 shadow-2xl max-h-[90vh] overflow-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/80 dark:border-gray-800 px-6 py-5 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Connect Website</h2>
                      <p className="text-xs text-slate-400">AI will analyze your site in seconds</p>
                    </div>
                  </div>
                  <button onClick={() => setShowConnect(false)} disabled={connecting}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {analysisResult ? (
                  /* ── Success State ── */
                  <div className="space-y-5">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="relative bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 rounded-2xl p-5 border border-emerald-200/80 dark:border-emerald-800/50">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">Website connected!</p>
                          <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">AI analyzed your site and generated 30 content topics</p>
                        </div>
                      </div>
                    </motion.div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Tech Stack', value: (analysisResult.website as Record<string, string>)?.techStack || 'Unknown' },
                        { label: 'Niche', value: (analysisResult.website as Record<string, string>)?.niche || 'General' },
                      ].map((item) => (
                        <div key={item.label} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Brand Voice</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 leading-relaxed border border-gray-100 dark:border-gray-800">
                        {analysisResult.brandVoice as string}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Generated Topics (30)</p>
                      <div className="max-h-[200px] overflow-auto space-y-1.5 rounded-xl border border-gray-100 dark:border-gray-800 p-2">
                        {((analysisResult.topics as string[]) || []).map((topic, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2.5">
                            <span className="text-[10px] text-purple-500 font-extrabold w-5 flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
                            <span className="truncate">{topic}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/20 rounded-2xl p-5 border border-purple-200/80 dark:border-purple-800/50">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-purple-800 dark:text-purple-200">Subscription Active</p>
                          <p className="text-xs text-purple-600/70 dark:text-purple-400/70">
                            30 blogs/month · {(analysisResult.subscription as Record<string, unknown>)?.blogsRemaining as number} remaining · Renews {(analysisResult.subscription as Record<string, unknown>)?.currentPeriodEnd as string}
                          </p>
                        </div>
                      </div>
                    </div>

                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      onClick={() => setShowConnect(false)}
                      className="w-full py-3.5 rounded-2xl text-white text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-xl shadow-purple-500/25 transition-all">
                      Done
                    </motion.button>
                  </div>
                ) : (
                  /* ── Connect Form ── */
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Website URL</label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          value={form.url} onChange={e => setForm({ ...form, url: e.target.value })}
                          placeholder="https://yourwebsite.com"
                          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Supports React, Next.js, WordPress, Shopify, HTML, PHP & more
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Publish Method</label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { value: 'ainos', icon: FileText, label: 'AINOS Blog', desc: 'Publish directly' },
                          { value: 'webhook', icon: Code, label: 'Webhook', desc: 'Any tech stack' },
                          { value: 'wordpress', icon: Globe, label: 'WordPress', desc: 'WP REST API' },
                          { value: 'email', icon: Mail, label: 'Email', desc: 'HTML delivery' },
                        ].map(m => (
                          <motion.button key={m.value} whileTap={{ scale: 0.97 }}
                            onClick={() => setForm({ ...form, publishMethod: m.value })}
                            className={`relative p-4 rounded-2xl border text-left transition-all duration-200 ${
                              form.publishMethod === m.value
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/15 ring-2 ring-purple-500/20 shadow-lg shadow-purple-500/10'
                                : 'border-gray-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-gray-800/30'
                            }`}
                          >
                            <m.icon className={`w-5 h-5 mb-2 ${form.publishMethod === m.value ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{m.label}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{m.desc}</p>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {form.publishMethod === 'webhook' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-3 bg-gradient-to-br from-sky-50 to-blue-50/50 dark:from-sky-950/20 dark:to-blue-950/10 rounded-2xl p-5 border border-sky-200/80 dark:border-sky-800/50">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Webhook URL</label>
                          <input value={form.webhookUrl} onChange={e => setForm({ ...form, webhookUrl: e.target.value })}
                            placeholder="https://yoursite.com/api/webhooks/ainos-blog"
                            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Secret <span className="text-slate-400 font-normal">(optional)</span></label>
                          <input value={form.webhookSecret} onChange={e => setForm({ ...form, webhookSecret: e.target.value })}
                            placeholder="your-secret-key"
                            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Receiver Code Snippets</p>
                          <div className="space-y-2">
                            {Object.entries(webhookSnippets).map(([lang, code]) => (
                              <WebhookSnippet key={lang} language={lang} code={code} />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {form.publishMethod === 'wordpress' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-3 bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/10 rounded-2xl p-5 border border-emerald-200/80 dark:border-emerald-800/50">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">WordPress URL</label>
                          <input value={form.wordpressUrl} onChange={e => setForm({ ...form, wordpressUrl: e.target.value })}
                            placeholder="https://yoursite.com"
                            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Username</label>
                            <input value={form.wordpressUsername} onChange={e => setForm({ ...form, wordpressUsername: e.target.value })}
                              placeholder="admin"
                              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">App Password</label>
                            <input value={form.wordpressAppPassword} onChange={e => setForm({ ...form, wordpressAppPassword: e.target.value })}
                              placeholder="xxxx xxxx xxxx"
                              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all" />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {form.publishMethod === 'email' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        className="bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/10 rounded-2xl p-5 border border-amber-200/80 dark:border-amber-800/50">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Delivery Email</label>
                        <input value={form.deliveryEmail} onChange={e => setForm({ ...form, deliveryEmail: e.target.value })}
                          type="email" placeholder="you@example.com"
                          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all" />
                        <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> Each blog delivered as formatted HTML email
                        </p>
                      </motion.div>
                    )}

                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      onClick={handleConnect} disabled={!form.url.trim() || connecting}
                      className="w-full py-4 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2.5 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-700 hover:via-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-purple-500/25">
                      {connecting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing your website...</>
                      ) : (
                        <><Sparkles className="w-4 h-4" /> Connect & Analyze <ChevronRight className="w-4 h-4" /></>
                      )}
                    </motion.button>

                    {connecting && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="relative bg-gradient-to-br from-purple-50 via-violet-50/50 to-indigo-50 dark:from-purple-950/30 dark:via-violet-950/20 dark:to-indigo-950/20 rounded-2xl p-5 border border-purple-200/80 dark:border-purple-800/50 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 animate-pulse" />
                        <div className="relative">
                          <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-pulse shadow-lg shadow-purple-500/50" />
                            <p className="text-sm font-bold text-purple-800 dark:text-purple-200">AI is analyzing your website</p>
                          </div>
                          <div className="space-y-2">
                            {['Scraping website content & structure', 'Detecting technology stack', 'Analyzing niche & brand voice', 'Generating 30 unique content topics', 'Setting up monthly publishing schedule'].map((step, i) => (
                              <motion.div key={step} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.4 }}
                                className="flex items-center gap-2.5 text-xs text-purple-600 dark:text-purple-400/80">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 dark:bg-purple-500" />
                                {step}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WebhookSnippet({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="relative bg-slate-900 dark:bg-gray-950 rounded-xl p-4 border border-slate-800">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{language}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-white transition-colors">
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">{code}</pre>
    </div>
  );
}
